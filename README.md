# SIGEP — Sistema Inteligente de Gestão de Escalas de Plantão

> Hospital de Urgência e Emergência de Rio Branco — HUERB

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Free-green?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)

---

## 📋 Sobre o Sistema

O SIGEP substitui completamente a gestão manual de escalas em planilhas Excel, automatizando a distribuição de plantões, gerenciando solicitações de folga e trocas, e oferecendo uma interface moderna e responsiva para toda a equipe.

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Estilização | TailwindCSS, Shadcn/UI, Lucide Icons |
| Backend | Next.js API Routes (Server Actions) |
| Banco de Dados | PostgreSQL via Supabase |
| Autenticação | JWT com cookies HTTP-only |
| Notificações | Web Push (VAPID) + WhatsApp (CallMeBot) |
| Hospedagem | Vercel (Frontend) + Supabase (Backend) |
| PWA | next-pwa |

---

## ⚡ Início Rápido

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/sigep.git
cd sigep
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Editar .env.local com suas credenciais
```

### 4. Configurar Supabase

1. Criar projeto gratuito em [supabase.com](https://supabase.com)
2. Ir em **SQL Editor** e executar:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
3. Copiar a URL e chaves para o `.env.local`

### 5. Gerar chaves VAPID (Push Notifications)

```bash
npx web-push generate-vapid-keys
# Copiar as chaves para o .env.local
```

### 6. Iniciar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🔐 Credenciais de Demonstração

| Perfil | Login | Senha |
|---|---|---|
| RT (Admin) | `rt.admin` | `Sigep@2026` |
| Funcionário | `ana.clara` | `Sigep@2026` |
| Funcionário | `fabiola` | `Sigep@2026` |

> **Nota:** Todos os funcionários do seed são forçados a trocar a senha no primeiro acesso.

---

## 📁 Estrutura do Projeto

```
sigep/
├── src/
│   ├── app/                  # Rotas Next.js (App Router)
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # Login, logout, me, change-password
│   │   │   ├── employees/    # CRUD de funcionários
│   │   │   ├── schedule/     # Geração, publicação, validação
│   │   │   ├── requests/     # Folgas e trocas
│   │   │   └── notifications/# Push e contagem
│   │   ├── auth/             # Páginas de autenticação
│   │   ├── dashboard/        # Dashboard RT e Funcionário
│   │   ├── schedule/         # Escala mensal (calendário)
│   │   ├── employees/        # Gestão de funcionários
│   │   ├── approvals/        # Central de aprovações (RT)
│   │   ├── audit/            # Auditoria imutável
│   │   └── settings/         # Configurações do sistema
│   ├── components/
│   │   ├── layout/           # Sidebar, TopBar, ThemeProvider
│   │   ├── schedule/         # ScheduleCalendar
│   │   ├── dashboard/        # RTDashboard, EmployeeDashboard
│   │   └── ui/               # Shadcn/UI components
│   ├── lib/
│   │   ├── services/         # Lógica de negócio
│   │   │   ├── auth.service.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── schedule-engine.service.ts
│   │   │   └── notification.service.ts
│   │   ├── supabase/         # Clientes Supabase
│   │   └── utils.ts
│   ├── middleware.ts          # Proteção de rotas
│   └── types/index.ts        # Tipos TypeScript
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # Schema completo
│       └── 002_seed_data.sql       # Dados demo (Agosto 2026)
├── public/
│   ├── manifest.json         # PWA manifest
│   └── icons/                # Ícones PWA
├── docker-compose.yml
├── Dockerfile
└── .env.example
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    Cliente (PWA)                     │
│         Next.js + React + TailwindCSS + Shadcn      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│              Next.js API Routes                      │
│    Auth │ Employees │ Schedule │ Requests │ Notifs  │
│              Middleware (JWT + RLS)                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   Supabase                           │
│     PostgreSQL │ RLS Policies │ Row Security        │
│         Auth │ Storage │ Realtime                   │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 Segurança

- ✅ JWT com cookies HTTP-only e SameSite=Strict
- ✅ Senhas com hash bcrypt (custo 12)
- ✅ Row Level Security (RLS) no Supabase
- ✅ Proteção XSS/CSRF/SQL Injection
- ✅ Headers de segurança (X-Frame-Options, CSP, etc)
- ✅ Auditoria imutável (trigger impede DELETE)
- ✅ Conformidade LGPD
- ✅ Logout automático por inatividade

---

## 🚢 Deploy Gratuito

### Vercel (Frontend + API)

```bash
npm install -g vercel
vercel --prod
```

### Supabase (Banco de Dados)

1. Criar projeto em [supabase.com](https://supabase.com) (plano gratuito)
2. Executar as migrations no SQL Editor
3. Configurar as variáveis de ambiente no Vercel

---

## 📱 PWA — Instalação

O SIGEP pode ser instalado diretamente no celular:

- **Android (Chrome):** Menu → "Adicionar à tela inicial"
- **iPhone (Safari):** Compartilhar → "Adicionar à Tela de Início"
- **Desktop (Chrome/Edge):** Clique no ícone de instalação na barra de endereços

---

## 📄 Licença

Desenvolvido para uso interno no HUERB — Hospital de Urgência e Emergência de Rio Branco, Acre, Brasil.

---

## 👥 Perfis do Sistema

### RT (Responsável Técnico)
- Acesso total ao sistema
- Gerar e publicar escalas
- Aprovar/negar solicitações (com justificativa obrigatória para negativas)
- Gerenciar funcionários e turnos
- Visualizar auditoria completa
- Configurar o sistema

### Funcionário
- Visualizar escala completa (publicada)
- Ver plantões próprios destacados
- Solicitar folga (mínimo 2 dias de antecedência)
- Solicitar troca (mínimo 2 dias de antecedência)
- Acompanhar solicitações em tempo real
- Receber notificações push e WhatsApp
