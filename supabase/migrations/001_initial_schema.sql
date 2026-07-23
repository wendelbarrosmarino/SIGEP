-- ============================================================
-- SIGEP — Schema Inicial do Banco de Dados
-- Sistema Inteligente de Gestão de Escalas de Plantão
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('RT', 'EMPLOYEE');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'DENIED');
CREATE TYPE request_type AS ENUM ('LEAVE', 'SWAP');
CREATE TYPE notification_type AS ENUM (
  'NEW_REQUEST',
  'NEW_SWAP',
  'REQUEST_APPROVED',
  'REQUEST_DENIED',
  'SCHEDULE_PUBLISHED',
  'SHIFT_CHANGED',
  'SWAP_APPROVED',
  'SWAP_DENIED'
);
CREATE TYPE audit_action AS ENUM (
  'LOGIN',
  'LOGOUT',
  'EMPLOYEE_CREATED',
  'EMPLOYEE_UPDATED',
  'EMPLOYEE_DELETED',
  'SHIFT_CREATED',
  'SHIFT_UPDATED',
  'SHIFT_DELETED',
  'SCHEDULE_GENERATED',
  'SCHEDULE_EDITED',
  'SCHEDULE_PUBLISHED',
  'SCHEDULE_UNPUBLISHED',
  'REQUEST_CREATED',
  'REQUEST_APPROVED',
  'REQUEST_DENIED',
  'SWAP_CREATED',
  'SWAP_ACCEPTED',
  'SWAP_APPROVED',
  'SWAP_DENIED',
  'PASSWORD_CHANGED',
  'SETTINGS_UPDATED'
);

-- ============================================================
-- TABELA: users (Funcionários e RT)
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  crm VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  login VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'EMPLOYEE',
  is_first_access BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para users
CREATE INDEX idx_users_login ON users(login);
CREATE INDEX idx_users_crm ON users(crm);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================
-- TABELA: shifts (Turnos)
-- ============================================================

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  min_staff INTEGER NOT NULL DEFAULT 1,
  max_staff INTEGER NOT NULL DEFAULT 5,
  color VARCHAR(7) NOT NULL DEFAULT '#0078D4',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para shifts
CREATE INDEX idx_shifts_code ON shifts(code);
CREATE INDEX idx_shifts_is_active ON shifts(is_active);

-- ============================================================
-- TABELA: schedules (Cabeçalho da Escala Mensal)
-- ============================================================

CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(month, year)
);

-- Índices para schedules
CREATE INDEX idx_schedules_month_year ON schedules(month, year);
CREATE INDEX idx_schedules_is_published ON schedules(is_published);

-- ============================================================
-- TABELA: schedule_entries (Entradas da Escala)
-- ============================================================

CREATE TABLE schedule_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(schedule_id, user_id, date, shift_id)
);

-- Índices para schedule_entries
CREATE INDEX idx_schedule_entries_schedule_id ON schedule_entries(schedule_id);
CREATE INDEX idx_schedule_entries_user_id ON schedule_entries(user_id);
CREATE INDEX idx_schedule_entries_shift_id ON schedule_entries(shift_id);
CREATE INDEX idx_schedule_entries_date ON schedule_entries(date);
CREATE INDEX idx_schedule_entries_user_date ON schedule_entries(user_id, date);

-- ============================================================
-- TABELA: leave_requests (Solicitações de Folga)
-- ============================================================

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_entry_id UUID REFERENCES schedule_entries(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'PENDING',
  rt_comment TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para leave_requests
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_date ON leave_requests(date);

-- ============================================================
-- TABELA: swap_requests (Solicitações de Troca)
-- ============================================================

CREATE TABLE swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_entry_id UUID NOT NULL REFERENCES schedule_entries(id) ON DELETE CASCADE,
  target_entry_id UUID NOT NULL REFERENCES schedule_entries(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'PENDING',
  target_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  rt_comment TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para swap_requests
CREATE INDEX idx_swap_requests_requester_id ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_target_id ON swap_requests(target_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);

-- ============================================================
-- TABELA: notifications (Notificações)
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================
-- TABELA: push_subscriptions (Assinaturas Push)
-- ============================================================

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para push_subscriptions
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ============================================================
-- TABELA: audit_logs (Auditoria — NUNCA APAGAR)
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- TABELA: system_settings (Configurações do Sistema)
-- ============================================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_name VARCHAR(255) NOT NULL DEFAULT 'HUERB',
  hospital_subtitle VARCHAR(255) DEFAULT 'Hospital de Urgência e Emergência de Rio Branco',
  logo_url TEXT,
  min_lead_time_days INTEGER NOT NULL DEFAULT 2,
  min_swap_lead_time_days INTEGER NOT NULL DEFAULT 2,
  allow_self_schedule BOOLEAN NOT NULL DEFAULT FALSE,
  vapid_public_key TEXT,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VIEWS
-- ============================================================

-- View: schedule_entries_detailed (Escala com detalhes)
CREATE OR REPLACE VIEW schedule_entries_detailed AS
SELECT
  se.id,
  se.schedule_id,
  se.date,
  se.created_at,
  se.updated_at,
  u.id AS user_id,
  u.name AS user_name,
  u.crm AS user_crm,
  u.phone AS user_phone,
  s.id AS shift_id,
  s.name AS shift_name,
  s.code AS shift_code,
  s.start_time AS shift_start,
  s.end_time AS shift_end,
  s.color AS shift_color,
  sc.month AS schedule_month,
  sc.year AS schedule_year,
  sc.is_published AS schedule_published
FROM schedule_entries se
JOIN users u ON u.id = se.user_id
JOIN shifts s ON s.id = se.shift_id
JOIN schedules sc ON sc.id = se.schedule_id;

-- View: pending_requests (Solicitações Pendentes)
CREATE OR REPLACE VIEW pending_requests AS
SELECT
  'LEAVE' AS type,
  lr.id,
  lr.user_id,
  lr.date,
  lr.status,
  lr.created_at,
  u.name AS user_name,
  u.crm AS user_crm,
  NULL AS target_user_id,
  NULL AS target_user_name
FROM leave_requests lr
JOIN users u ON u.id = lr.user_id
WHERE lr.status = 'PENDING'
UNION ALL
SELECT
  'SWAP' AS type,
  sr.id,
  sr.requester_id AS user_id,
  se.date,
  sr.status,
  sr.created_at,
  u.name AS user_name,
  u.crm AS user_crm,
  sr.target_id AS target_user_id,
  t.name AS target_user_name
FROM swap_requests sr
JOIN users u ON u.id = sr.requester_id
JOIN users t ON t.id = sr.target_id
JOIN schedule_entries se ON se.id = sr.requester_entry_id
WHERE sr.status = 'PENDING';

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: updated_at automático
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_shifts
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_schedules
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_schedule_entries
  BEFORE UPDATE ON schedule_entries
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_leave_requests
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_swap_requests
  BEFORE UPDATE ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Trigger: Impedir exclusão de audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Registros de auditoria não podem ser excluídos.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_delete_audit_logs
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter role do JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'EMPLOYEE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter ID do usuário logado
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::json->>'sub')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: users
CREATE POLICY "RT pode ver todos os usuários" ON users
  FOR SELECT USING (get_user_role() = 'RT');

CREATE POLICY "Funcionário vê apenas seus próprios dados" ON users
  FOR SELECT USING (id = get_current_user_id());

CREATE POLICY "RT pode gerenciar usuários" ON users
  FOR ALL USING (get_user_role() = 'RT');

-- Policies: shifts
CREATE POLICY "Todos veem turnos ativos" ON shifts
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "RT gerencia turnos" ON shifts
  FOR ALL USING (get_user_role() = 'RT');

-- Policies: schedules
CREATE POLICY "Funcionários veem escalas publicadas" ON schedules
  FOR SELECT USING (is_published = TRUE OR get_user_role() = 'RT');

CREATE POLICY "RT gerencia escalas" ON schedules
  FOR ALL USING (get_user_role() = 'RT');

-- Policies: schedule_entries
CREATE POLICY "Todos veem entradas de escala publicada" ON schedule_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
      AND (s.is_published = TRUE OR get_user_role() = 'RT')
    )
  );

CREATE POLICY "RT gerencia entradas" ON schedule_entries
  FOR ALL USING (get_user_role() = 'RT');

-- Policies: leave_requests
CREATE POLICY "Funcionário vê suas próprias solicitações" ON leave_requests
  FOR SELECT USING (user_id = get_current_user_id() OR get_user_role() = 'RT');

CREATE POLICY "Funcionário cria suas próprias solicitações" ON leave_requests
  FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "RT gerencia todas as solicitações" ON leave_requests
  FOR ALL USING (get_user_role() = 'RT');

-- Policies: swap_requests
CREATE POLICY "Usuário vê trocas que lhe dizem respeito" ON swap_requests
  FOR SELECT USING (
    requester_id = get_current_user_id()
    OR target_id = get_current_user_id()
    OR get_user_role() = 'RT'
  );

CREATE POLICY "Funcionário solicita troca" ON swap_requests
  FOR INSERT WITH CHECK (requester_id = get_current_user_id());

CREATE POLICY "RT gerencia trocas" ON swap_requests
  FOR ALL USING (get_user_role() = 'RT');

-- Policies: notifications
CREATE POLICY "Usuário vê suas notificações" ON notifications
  FOR SELECT USING (user_id = get_current_user_id() OR get_user_role() = 'RT');

CREATE POLICY "Sistema cria notificações" ON notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Usuário marca como lida" ON notifications
  FOR UPDATE USING (user_id = get_current_user_id());

-- Policies: push_subscriptions
CREATE POLICY "Usuário gerencia suas subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = get_current_user_id());

-- Policies: audit_logs
CREATE POLICY "RT vê todos os logs" ON audit_logs
  FOR SELECT USING (get_user_role() = 'RT');

CREATE POLICY "Sistema insere logs" ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- Policies: system_settings
CREATE POLICY "Todos leem configurações" ON system_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "RT atualiza configurações" ON system_settings
  FOR UPDATE USING (get_user_role() = 'RT');
