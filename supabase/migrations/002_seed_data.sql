-- ============================================================
-- SIGEP — Seed de Dados de Demonstração
-- Baseado na Escala Ambulatório Agosto 2026 - HUERB
-- ============================================================

-- Configurações iniciais do sistema
INSERT INTO system_settings (hospital_name, hospital_subtitle, min_lead_time_days, min_swap_lead_time_days, push_enabled)
VALUES ('HUERB', 'Hospital de Urgência e Emergência de Rio Branco', 2, 2, TRUE);

-- ============================================================
-- USUÁRIOS (senha padrão: Sigep@2026 — hash bcrypt)
-- ============================================================
-- RT (Responsável Técnico)
INSERT INTO users (id, name, crm, phone, login, password_hash, role, is_first_access) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ana Paula Gestora', 'RT-00001', '68999990001', 'rt.admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'RT', FALSE);

-- Funcionários (extraídos da escala)
INSERT INTO users (id, name, crm, phone, login, password_hash, role, is_first_access) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Ana Clara Alencar',  'CRM-10001', '68999990101', 'ana.clara',    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000002', 'Suyanne Mappes',      'CRM-10002', '68999990102', 'suyanne',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000003', 'Ana Vitória',         'CRM-10003', '68999990103', 'ana.vitoria',   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000004', 'Rallyson Frota',      'CRM-10004', '68999990104', 'rallyson',      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000005', 'Marco Pacheco',       'CRM-10005', '68999990105', 'marco',         '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000006', 'Flavia Dias',         'CRM-10006', '68999990106', 'flavia',        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000007', 'Ana Luiza Ribeiro',   'CRM-10007', '68999990107', 'ana.luiza',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000008', 'Suziany Dantas',      'CRM-10008', '68999990108', 'suziany',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000009', 'Andressa Moreira',    'CRM-10009', '68999990109', 'andressa',      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000010', 'Larissa Magalhães',   'CRM-10010', '68999990110', 'larissa',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000011', 'Juliana Betão',       'CRM-10011', '68999990111', 'juliana.b',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000012', 'Juliana Moraes',      'CRM-10012', '68999990112', 'juliana.m',     '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000013', 'Pedro Willian',       'CRM-10013', '68999990113', 'pedro',         '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000014', 'Heloisa Pena',        'CRM-10014', '68999990114', 'heloisa',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000015', 'Fabiola Daiana',      'CRM-10015', '68999990115', 'fabiola',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000016', 'Janeila Andrade',     'CRM-10016', '68999990116', 'janeila',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000017', 'Savanna Santos',      'CRM-10017', '68999990117', 'savanna',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000018', 'Mariana Costa',       'CRM-10018', '68999990118', 'mariana',       '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000019', 'André Lucas',         'CRM-10019', '68999990119', 'andre',         '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000020', 'Danielle Mariano',    'CRM-10020', '68999990120', 'danielle',      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE),
  ('10000000-0000-0000-0000-000000000021', 'Rubens Claudino',     'CRM-10021', '68999990121', 'rubens',        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniP7DFkB.LuW.jjBkQf2j5rB2', 'EMPLOYEE', TRUE);

-- ============================================================
-- TURNOS
-- ============================================================
INSERT INTO shifts (id, name, code, start_time, end_time, min_staff, max_staff, color) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Plantão Diurno',    'PD', '07:00', '19:00', 2, 4, '#0078D4'),
  ('20000000-0000-0000-0000-000000000002', 'Manhã',             'M',  '07:00', '13:00', 1, 3, '#107C10'),
  ('20000000-0000-0000-0000-000000000003', 'Tarde',             'T',  '13:00', '19:00', 1, 3, '#FFB900'),
  ('20000000-0000-0000-0000-000000000004', 'Folga Trabalhada',  'FT', '07:00', '19:00', 1, 2, '#8764B8'),
  ('20000000-0000-0000-0000-000000000005', 'Plantão Noturno',   'PN', '19:00', '07:00', 2, 5, '#D13438');

-- ============================================================
-- ESCALA: Agosto 2026
-- ============================================================
INSERT INTO schedules (id, month, year, is_published, published_at, published_by)
VALUES ('30000000-0000-0000-0000-000000000001', 8, 2026, TRUE, NOW(), '00000000-0000-0000-0000-000000000001');

-- Alias para clareza
DO $$
DECLARE
  sch_id UUID := '30000000-0000-0000-0000-000000000001';
  -- Turnos
  PD UUID := '20000000-0000-0000-0000-000000000001';
  M  UUID := '20000000-0000-0000-0000-000000000002';
  T  UUID := '20000000-0000-0000-0000-000000000003';
  FT UUID := '20000000-0000-0000-0000-000000000004';
  PN UUID := '20000000-0000-0000-0000-000000000005';
  -- Funcionários
  ACA UUID := '10000000-0000-0000-0000-000000000001'; -- Ana Clara
  SUY UUID := '10000000-0000-0000-0000-000000000002'; -- Suyanne
  AVI UUID := '10000000-0000-0000-0000-000000000003'; -- Ana Vitória
  RAL UUID := '10000000-0000-0000-0000-000000000004'; -- Rallyson
  MAR UUID := '10000000-0000-0000-0000-000000000005'; -- Marco
  FLA UUID := '10000000-0000-0000-0000-000000000006'; -- Flavia
  ALR UUID := '10000000-0000-0000-0000-000000000007'; -- Ana Luiza
  SUZ UUID := '10000000-0000-0000-0000-000000000008'; -- Suziany
  ANR UUID := '10000000-0000-0000-0000-000000000009'; -- Andressa
  LAR UUID := '10000000-0000-0000-0000-000000000010'; -- Larissa
  JBE UUID := '10000000-0000-0000-0000-000000000011'; -- Juliana Betão
  JMO UUID := '10000000-0000-0000-0000-000000000012'; -- Juliana Moraes
  PED UUID := '10000000-0000-0000-0000-000000000013'; -- Pedro
  HEL UUID := '10000000-0000-0000-0000-000000000014'; -- Heloisa
  FAB UUID := '10000000-0000-0000-0000-000000000015'; -- Fabiola
  JAN UUID := '10000000-0000-0000-0000-000000000016'; -- Janeila
  SAV UUID := '10000000-0000-0000-0000-000000000017'; -- Savanna
  MCA UUID := '10000000-0000-0000-0000-000000000018'; -- Mariana
  ADL UUID := '10000000-0000-0000-0000-000000000019'; -- André
  DAN UUID := '10000000-0000-0000-0000-000000000020'; -- Danielle
  RUB UUID := '10000000-0000-0000-0000-000000000021'; -- Rubens
BEGIN
  -- DIA 01 (Sábado)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, MAR, PD, '2026-08-01'), (sch_id, FLA, PD, '2026-08-01'), (sch_id, ACA, FT, '2026-08-01'),
    (sch_id, ALR, PN, '2026-08-01'), (sch_id, SUZ, PN, '2026-08-01'), (sch_id, ANR, PN, '2026-08-01');

  -- DIA 02 (Domingo)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, SUY, M, '2026-08-02'), (sch_id, AVI, T, '2026-08-02'), (sch_id, RAL, PD, '2026-08-02'), (sch_id, ACA, FT, '2026-08-02'),
    (sch_id, ADL, PN, '2026-08-02'), (sch_id, MAR, PN, '2026-08-02'), (sch_id, PED, PN, '2026-08-02');

  -- DIA 03 (Segunda)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, ACA, M, '2026-08-03'), (sch_id, JBE, T, '2026-08-03'), (sch_id, FAB, PD, '2026-08-03'), (sch_id, RAL, FT, '2026-08-03'),
    (sch_id, LAR, PN, '2026-08-03'), (sch_id, SUY, PN, '2026-08-03'), (sch_id, JAN, PN, '2026-08-03');

  -- DIA 04 (Terça)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, JMO, PD, '2026-08-04'), (sch_id, PED, PD, '2026-08-04'), (sch_id, HEL, FT, '2026-08-04'),
    (sch_id, LAR, PN, '2026-08-04'), (sch_id, RAL, PN, '2026-08-04'), (sch_id, ANR, PN, '2026-08-04');

  -- DIA 05 (Quarta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, SAV, T, '2026-08-05'), (sch_id, ACA, M, '2026-08-05'), (sch_id, FAB, PD, '2026-08-05'), (sch_id, JAN, FT, '2026-08-05'),
    (sch_id, MAR, PN, '2026-08-05'), (sch_id, LAR, PN, '2026-08-05'), (sch_id, SUY, PN, '2026-08-05');

  -- DIA 06 (Quinta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-06'), (sch_id, RAL, M, '2026-08-06'), (sch_id, LAR, T, '2026-08-06'), (sch_id, HEL, FT, '2026-08-06'),
    (sch_id, MCA, PN, '2026-08-06'), (sch_id, ANR, PN, '2026-08-06'), (sch_id, JAN, PN, '2026-08-06');

  -- DIA 07 (Sexta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, PED, PD, '2026-08-07'), (sch_id, ACA, PD, '2026-08-07'), (sch_id, JAN, FT, '2026-08-07'),
    (sch_id, ALR, PN, '2026-08-07'), (sch_id, MAR, PN, '2026-08-07'), (sch_id, DAN, PN, '2026-08-07');

  -- DIA 08 (Sábado)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, SAV, M, '2026-08-08'), (sch_id, SUY, T, '2026-08-08'), (sch_id, FLA, PD, '2026-08-08'), (sch_id, ACA, FT, '2026-08-08'),
    (sch_id, AVI, PN, '2026-08-08'), (sch_id, ALR, PN, '2026-08-08'), (sch_id, SUZ, PN, '2026-08-08');

  -- DIA 09 (Domingo)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, MAR, PD, '2026-08-09'), (sch_id, HEL, M, '2026-08-09'), (sch_id, RAL, T, '2026-08-09'), (sch_id, ACA, FT, '2026-08-09'),
    (sch_id, ANR, PN, '2026-08-09'), (sch_id, PED, PN, '2026-08-09'), (sch_id, ADL, PN, '2026-08-09');

  -- DIA 10 (Segunda)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-10'), (sch_id, ACA, M, '2026-08-10'), (sch_id, JMO, T, '2026-08-10'), (sch_id, RAL, FT, '2026-08-10'),
    (sch_id, LAR, PN, '2026-08-10'), (sch_id, MAR, PN, '2026-08-10'), (sch_id, SUY, PN, '2026-08-10');

  -- DIA 11 (Terça)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, JMO, PD, '2026-08-11'), (sch_id, HEL, PD, '2026-08-11'), (sch_id, DAN, FT, '2026-08-11'),
    (sch_id, LAR, PN, '2026-08-11'), (sch_id, SAV, PN, '2026-08-11'), (sch_id, ANR, PN, '2026-08-11');

  -- DIA 12 (Quarta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-12'), (sch_id, AVI, PD, '2026-08-12'), (sch_id, JAN, FT, '2026-08-12'),
    (sch_id, MAR, PN, '2026-08-12'), (sch_id, LAR, PN, '2026-08-12'), (sch_id, PED, PN, '2026-08-12');

  -- DIA 13 (Quinta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-13'), (sch_id, RAL, M, '2026-08-13'), (sch_id, LAR, T, '2026-08-13'), (sch_id, HEL, FT, '2026-08-13'),
    (sch_id, MCA, PN, '2026-08-13'), (sch_id, ANR, PN, '2026-08-13'), (sch_id, JAN, PN, '2026-08-13');

  -- DIA 14 (Sexta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, PED, PD, '2026-08-14'), (sch_id, ACA, PD, '2026-08-14'), (sch_id, JAN, FT, '2026-08-14'),
    (sch_id, ALR, PN, '2026-08-14'), (sch_id, FLA, PN, '2026-08-14'), (sch_id, RAL, PN, '2026-08-14');

  -- DIA 15 (Sábado)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, SUY, PD, '2026-08-15'), (sch_id, ADL, PD, '2026-08-15'), (sch_id, ACA, FT, '2026-08-15'),
    (sch_id, HEL, PN, '2026-08-15'), (sch_id, MAR, PN, '2026-08-15'), (sch_id, SAV, PN, '2026-08-15');

  -- DIA 16 (Domingo)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, RAL, PD, '2026-08-16'), (sch_id, ACA, M, '2026-08-16'), (sch_id, DAN, T, '2026-08-16'), (sch_id, MAR, FT, '2026-08-16'),
    (sch_id, AVI, PN, '2026-08-16'), (sch_id, ALR, PN, '2026-08-16'), (sch_id, ANR, PN, '2026-08-16');

  -- DIA 17 (Segunda)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, PED, PD, '2026-08-17'), (sch_id, ACA, M, '2026-08-17'), (sch_id, FAB, T, '2026-08-17'), (sch_id, RAL, FT, '2026-08-17'),
    (sch_id, LAR, PN, '2026-08-17'), (sch_id, SUY, PN, '2026-08-17'), (sch_id, JAN, PN, '2026-08-17');

  -- DIA 18 (Terça)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, JMO, PD, '2026-08-18'), (sch_id, SAV, M, '2026-08-18'), (sch_id, HEL, T, '2026-08-18'), (sch_id, RAL, FT, '2026-08-18'),
    (sch_id, ANR, PN, '2026-08-18'), (sch_id, ALR, PN, '2026-08-18'), (sch_id, MAR, PN, '2026-08-18');

  -- DIA 19 (Quarta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-19'), (sch_id, ACA, M, '2026-08-19'), (sch_id, JBE, T, '2026-08-19'), (sch_id, JAN, FT, '2026-08-19'),
    (sch_id, SUY, PN, '2026-08-19'), (sch_id, LAR, PN, '2026-08-19'), (sch_id, PED, PN, '2026-08-19');

  -- DIA 20 (Quinta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-20'), (sch_id, RAL, M, '2026-08-20'), (sch_id, LAR, T, '2026-08-20'), (sch_id, DAN, FT, '2026-08-20'),
    (sch_id, MCA, PN, '2026-08-20'), (sch_id, ANR, PN, '2026-08-20'), (sch_id, JAN, PN, '2026-08-20');

  -- DIA 21 (Sexta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, HEL, M, '2026-08-21'), (sch_id, AVI, T, '2026-08-21'), (sch_id, PED, PD, '2026-08-21'), (sch_id, HEL, FT, '2026-08-21'),
    (sch_id, ALR, PN, '2026-08-21'), (sch_id, MAR, PN, '2026-08-21'), (sch_id, RAL, PN, '2026-08-21');

  -- DIA 22 (Sábado)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, DAN, PD, '2026-08-22'), (sch_id, RUB, PD, '2026-08-22'), (sch_id, SUY, FT, '2026-08-22'),
    (sch_id, MAR, PN, '2026-08-22'), (sch_id, ADL, PN, '2026-08-22'), (sch_id, ALR, PN, '2026-08-22');

  -- DIA 23 (Domingo)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, ALR, PD, '2026-08-23'), (sch_id, SAV, PD, '2026-08-23'), (sch_id, SUZ, FT, '2026-08-23'),
    (sch_id, AVI, PN, '2026-08-23'), (sch_id, PED, PN, '2026-08-23'), (sch_id, FLA, PN, '2026-08-23');

  -- DIA 24 (Segunda)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-24'), (sch_id, JAN, M, '2026-08-24'), (sch_id, JMO, T, '2026-08-24'), (sch_id, RAL, FT, '2026-08-24'),
    (sch_id, LAR, PN, '2026-08-24'), (sch_id, JAN, PN, '2026-08-24'), (sch_id, ADL, PN, '2026-08-24');

  -- DIA 25 (Terça)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, JMO, PD, '2026-08-25'), (sch_id, HEL, PD, '2026-08-25'), (sch_id, SAV, FT, '2026-08-25'),
    (sch_id, ANR, PN, '2026-08-25'), (sch_id, ALR, PN, '2026-08-25'), (sch_id, LAR, PN, '2026-08-25');

  -- DIA 26 (Quarta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-26'), (sch_id, FLA, M, '2026-08-26'), (sch_id, JMO, T, '2026-08-26'), (sch_id, JAN, FT, '2026-08-26'),
    (sch_id, SUY, PN, '2026-08-26'), (sch_id, LAR, PN, '2026-08-26'), (sch_id, PED, PN, '2026-08-26');

  -- DIA 27 (Quinta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-27'), (sch_id, AVI, M, '2026-08-27'), (sch_id, LAR, T, '2026-08-27'), (sch_id, RUB, FT, '2026-08-27'),
    (sch_id, MCA, PN, '2026-08-27'), (sch_id, DAN, PN, '2026-08-27'), (sch_id, JAN, PN, '2026-08-27');

  -- DIA 28 (Sexta)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, ACA, PD, '2026-08-28'), (sch_id, PED, PD, '2026-08-28'), (sch_id, JAN, FT, '2026-08-28'),
    (sch_id, ALR, PN, '2026-08-28'), (sch_id, PED, PN, '2026-08-28'), (sch_id, FLA, PN, '2026-08-28');

  -- DIA 29 (Sábado)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, ACA, PD, '2026-08-29'), (sch_id, AVI, PD, '2026-08-29'), (sch_id, SUY, FT, '2026-08-29'),
    (sch_id, ALR, PN, '2026-08-29'), (sch_id, SUZ, PN, '2026-08-29'), (sch_id, MAR, PN, '2026-08-29');

  -- DIA 30 (Domingo)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, RAL, PD, '2026-08-30'), (sch_id, ACA, M, '2026-08-30'), (sch_id, FLA, T, '2026-08-30'), (sch_id, ALR, FT, '2026-08-30'),
    (sch_id, ADL, PN, '2026-08-30'), (sch_id, RUB, PN, '2026-08-30'), (sch_id, PED, PN, '2026-08-30');

  -- DIA 31 (Segunda)
  INSERT INTO schedule_entries (schedule_id, user_id, shift_id, date) VALUES
    (sch_id, FAB, PD, '2026-08-31'), (sch_id, ACA, M, '2026-08-31'), (sch_id, JMO, T, '2026-08-31'), (sch_id, SAV, FT, '2026-08-31'),
    (sch_id, LAR, PN, '2026-08-31'), (sch_id, MAR, PN, '2026-08-31'), (sch_id, DAN, PN, '2026-08-31');
END $$;

-- Auditoria inicial
INSERT INTO audit_logs (user_id, action, description, ip_address, user_agent, metadata)
VALUES ('00000000-0000-0000-0000-000000000001', 'SCHEDULE_PUBLISHED', 'Escala de Agosto/2026 publicada — dados de demonstração', '127.0.0.1', 'Sistema/Seed', '{"month": 8, "year": 2026}');
