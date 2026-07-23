# SIGEP — Manual do Responsável Técnico (RT)

## Acesso ao Sistema

**URL:** https://sigep.vercel.app (ou seu domínio configurado)

**Credenciais iniciais:**
- Login: `rt.admin`
- Senha: definida no cadastro inicial

---

## 1. Login

1. Acesse a URL do sistema
2. Insira seu login e senha
3. No **primeiro acesso**, o sistema exige a criação de uma nova senha segura:
   - Mínimo 8 caracteres
   - Pelo menos uma letra maiúscula
   - Pelo menos um número
   - Pelo menos um caractere especial

---

## 2. Dashboard

O Dashboard exibe um resumo em tempo real:

- **Plantões de hoje** — quem está escalado agora
- **Folgas pendentes** — solicitações aguardando análise
- **Trocas pendentes** — trocas aguardando aprovação
- **Últimas alterações** — registro das ações recentes
- **Ações rápidas** — botões para gerar escala, publicar, novo funcionário, configurações

---

## 3. Gerenciar Funcionários

### Cadastrar Funcionário

1. Acesse **Funcionários** no menu lateral
2. Clique em **Novo Funcionário**
3. Preencha:
   - Nome completo
   - CRM (único no sistema)
   - WhatsApp (para notificações)
   - Login (único no sistema)
   - Senha inicial (o funcionário será obrigado a trocar no primeiro acesso)
4. Clique em **Cadastrar**

### Editar Funcionário

1. Na lista de funcionários, clique no ícone de lápis
2. Edite os dados desejados
3. Salve as alterações

### Desativar Funcionário

> ⚠️ A exclusão é um soft delete — os registros históricos são mantidos para auditoria.

1. Na lista, clique no ícone de lixeira
2. Confirme a desativação

### Pesquisar

Use a barra de busca para filtrar por **nome**, **CRM** ou **telefone**.

---

## 4. Gerenciar Turnos

1. Acesse **Turnos** no menu lateral
2. Você pode criar quantos turnos forem necessários

Para cada turno, configure:
- **Nome** (ex: Plantão Diurno)
- **Código** (ex: PD)
- **Hora Inicial** e **Hora Final**
- **Quantidade Mínima** de profissionais
- **Quantidade Máxima** de profissionais
- **Cor** de identificação no calendário

**Turnos padrão configurados:**

| Código | Nome | Horário |
|---|---|---|
| PD | Plantão Diurno | 07:00 – 19:00 |
| M | Manhã | 07:00 – 13:00 |
| T | Tarde | 13:00 – 19:00 |
| FT | Folga Trabalhada | 07:00 – 19:00 |
| PN | Plantão Noturno | 19:00 – 07:00 |

---

## 5. Gerar Escala

1. Acesse **Escala** → **Gerar Escala**
2. Selecione o mês e ano
3. Configure:
   - Quais turnos incluir
   - Quais funcionários incluir (ou todos os ativos)
   - Se deve respeitar as folgas aprovadas
4. Clique em **Gerar**

O motor de escalas irá:
- Distribuir automaticamente os profissionais
- Equilibrar a carga de trabalho
- Evitar conflitos de horário
- Respeitar as folgas aprovadas

> Você pode **reeditar manualmente** qualquer entrada após a geração.

---

## 6. Painel de Conflitos

Antes de publicar, o sistema valida automaticamente:

- ❌ Turnos sem profissionais suficientes
- ❌ Profissionais duplicados no mesmo turno/dia
- ⚠️ Turnos com excesso de profissionais
- ⚠️ Solicitações pendentes afetando datas da escala

Se existir qualquer **erro (❌)**, a publicação é bloqueada. Avisos (⚠️) permitem publicação mas exigem atenção.

---

## 7. Publicar Escala

1. Com a escala gerada e sem conflitos críticos
2. Acesse **Escala** no menu
3. Clique em **Publicar Escala**
4. O sistema valida automaticamente e publica
5. **Todos os funcionários recebem notificação automática** (push + WhatsApp)

Para **cancelar a publicação** (reverter para rascunho):
- Clique em **Cancelar Publicação**
- A escala voltará a ser editável

---

## 8. Central de Aprovações

Acesse **Aprovações** para gerenciar todas as solicitações.

### Filtros disponíveis:
- Todas | Pendentes | Aprovadas | Negadas
- Por tipo: Folgas | Trocas

### Aprovar solicitação:
1. Clique em **Aprovar**
2. Confirme
3. O funcionário recebe notificação automática

### Negar solicitação:
1. Clique em **Negar**
2. **Informe obrigatoriamente a justificativa** (mínimo 10 caracteres)
3. O funcionário recebe a notificação com o motivo completo

> ⚠️ **Regra:** Não é possível negar sem justificativa. O sistema bloqueia o envio.

### Trocas de Plantão:

O fluxo de aprovação de trocas é:
1. Funcionário A solicita troca com B
2. Funcionário B aceita no sistema
3. **RT analisa e aprova ou nega**
4. Se aprovado, a escala é alterada automaticamente

---

## 9. Auditoria

Acesse **Auditoria** para visualizar o histórico completo de ações.

Registros incluem:
- Data e hora exata
- Usuário responsável
- Endereço IP
- Descrição detalhada da ação

> 🔒 **Registros de auditoria nunca podem ser apagados.** Um trigger no banco impede qualquer tentativa de exclusão.

---

## 10. Configurações

Acesse **Configurações** para personalizar:

- Nome e subtítulo do hospital
- Antecedência mínima para folgas (padrão: 2 dias)
- Antecedência mínima para trocas (padrão: 2 dias)
- Habilitar/desabilitar WhatsApp
- Habilitar/desabilitar Push Notifications
- Chave VAPID pública para Push

---

## 11. Tema Claro/Escuro

Clique no ícone de sol/lua na barra superior para alternar entre os temas.

---

## 12. Instalar como Aplicativo (PWA)

**Android:** Abra no Chrome → Menu (⋮) → "Adicionar à tela inicial"

**iPhone:** Abra no Safari → Compartilhar (□↑) → "Adicionar à Tela de Início"

**Desktop:** Clique no ícone de instalação na barra de endereços do Chrome/Edge

---

## Suporte

Em caso de problemas, consulte os registros de auditoria ou entre em contato com o administrador do sistema.
