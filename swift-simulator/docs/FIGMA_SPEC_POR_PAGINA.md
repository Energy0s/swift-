# Especificação por Página — SWIFT Transfer (para Figma)

Este documento descreve **página a página** tudo que cada tela precisa ter. O design e o estilo são seus; aqui está apenas a estrutura, conteúdo e funcionalidades que o backend vai consumir. Depois de desenhar no Figma, você importa e conectamos ao backend.

---

## Página 1: Login

### Elementos obrigatórios
- **Título** — ex: "SWIFT Transfer" ou nome do app
- **Subtítulo** — ex: "Entre na sua conta"
- **Campo de email** — label "Email", tipo texto, obrigatório
- **Campo de senha** — label "Senha", tipo password, obrigatório
- **Botão "Entrar"** — ação principal
- **Link "Esqueci minha senha"** — leva para recuperação de senha
- **Link "Não tem conta? Cadastre-se"** — leva para página de registro
- **Área de mensagem de erro** — exibe erros (ex: "Credenciais inválidas")

### Comportamento (para conectar no backend)
- Submit do formulário → `POST /api/auth/login` com `{ email, password }`
- Sucesso → redireciona para Dashboard
- Erro → exibe mensagem na área de erro

---

## Página 2: Registro

### Elementos obrigatórios
- **Título** — ex: "Criar conta"
- **Campo Nome completo** — label "Nome", obrigatório
- **Campo Email** — label "Email", obrigatório
- **Campo Senha** — label "Senha", tipo password, obrigatório
- **Campo Confirmar senha** — label "Confirmar senha", tipo password, obrigatório
- **Botão "Cadastrar"** — ação principal
- **Link "Já tem conta? Entrar"** — leva para login
- **Área de mensagem de erro** — exibe erros (ex: "Senhas não coincidem")

### Comportamento
- Submit → `POST /api/auth/register` com `{ name, email, password }`
- Sucesso → redireciona para Dashboard
- Erro → exibe mensagem

---

## Página 3: Recuperação de senha (opcional)

### Elementos obrigatórios
- **Título** — ex: "Recuperar senha"
- **Campo Email** — label "Email", obrigatório
- **Botão "Enviar link"** — envia email de recuperação
- **Link "Voltar ao login"**

### Comportamento
- Submit → `POST /api/auth/forgot-password` com `{ email }`

---

## Página 4: Dashboard (após login)

### Elementos obrigatórios
- **Cabeçalho / Topbar**
  - Logo ou nome do app
  - Menu de navegação: Dashboard, Transferências, Histórico, Perfil
  - Nome do usuário e botão Sair
- **Resumo de contas**
  - Lista de contas com: número da conta, IBAN, saldo, moeda
  - Cada conta clicável para ver detalhes
- **Últimas transações**
  - Tabela ou lista: data, descrição, valor, status
  - Link "Ver todas" → página de Histórico
- **Ações rápidas**
  - Botão "Nova transferência" → página de Transferência
- **Alertas / notificações** (opcional)
  - Área para mensagens importantes (ex: limite próximo)

### Dados do backend
- `GET /api/accounts` — lista de contas
- `GET /api/transfers?limit=5` — últimas transferências

---

## Página 5: Transferência SWIFT (nova transferência)

### Elementos obrigatórios
- **Cabeçalho** — igual ao Dashboard
- **Formulário de transferência**
  - **Conta de origem** — dropdown/select com contas do usuário
  - **IBAN do destinatário** — campo texto, obrigatório
  - **BIC/SWIFT do banco** — campo texto, obrigatório
  - **Nome do beneficiário** — campo texto, obrigatório
  - **Valor** — campo numérico, obrigatório
  - **Moeda** — select (USD, EUR, GBP, BRL, etc.)
  - **Propósito / Referência** — campo texto (opcional)
  - **Categoria SEPA** (opcional) — select: Salário, Bens/Serviços, Fornecedor, Governo, Outro (para transferências SEPA)
- **Resumo da transferência** (calculado)
  - Taxa de câmbio (se moeda diferente)
  - Taxa da transferência
  - Valor total debitado
- **Botão "Validar"** — valida IBAN e BIC antes de confirmar
- **Botão "Confirmar transferência"** — envia a transferência
- **Área de mensagem de erro/validação**
- **Feedback de validação** — ex: "IBAN válido ✓" ou "IBAN inválido ✗"

### Comportamento
- Contas → `GET /api/accounts`
- Validar IBAN → `POST /api/validate/iban` com `{ iban }`
- Validar BIC → `POST /api/validate/bic` com `{ bic }`
- Taxas de câmbio → `GET /api/exchange/rates`
- Submit → `POST /api/transfers` com os dados do formulário

---

## Página 6: Histórico de transações

### Elementos obrigatórios
- **Cabeçalho** — igual ao Dashboard
- **Filtros**
  - Status (Todos, Pendente, Concluído, Falhou)
  - Período (opcional)
  - Busca por referência (opcional)
- **Tabela / Lista de transações**
  - Colunas: Data, Nº Referência, Destinatário, Valor, Moeda, Status
  - Cada linha clicável para ver detalhes
- **Paginação** — se houver muitas transações
- **Botão "Nova transferência"**

### Dados do backend
- `GET /api/transfers?page=1&limit=10&status=...`

---

## Página 7: Detalhes da transação

### Elementos obrigatórios
- **Cabeçalho** — igual ao Dashboard
- **Botão "Voltar"** — retorna ao histórico
- **Informações da transferência**
  - Número de referência SWIFT
  - Status atual (com indicador visual: pendente, processando, concluído, falhou)
  - Data/hora de criação
  - Conta de origem
  - IBAN e BIC do destinatário
  - Nome do beneficiário
  - Valor e moeda
  - Taxas
  - Valor total
  - Propósito
- **Linha do tempo / Status history**
  - Cada etapa: status, data/hora, descrição
  - Ex: "Criado" → "Enviado" → "Processando" → "Concluído"
- **Mensagem SWIFT** (opcional, expansível)
  - Exibição da mensagem MT103 gerada

### Dados do backend
- `GET /api/transfers/{id}`

---

## Página 8: Detalhes da conta

### Elementos obrigatórios
- **Cabeçalho** — igual ao Dashboard
- **Informações da conta**
  - Número da conta
  - IBAN
  - BIC
  - Saldo atual
  - Moeda
  - Limite diário
- **Movimentações recentes**
  - Lista das últimas transações dessa conta
- **Botão "Nova transferência"** (usando esta conta)

### Dados do backend
- `GET /api/accounts/{id}`
- `GET /api/transfers?accountId={id}`

---

## Página 9: Perfil do usuário

### Elementos obrigatórios
- **Cabeçalho** — igual ao Dashboard
- **Informações editáveis**
  - Nome completo
  - Email
- **Botão "Salvar alterações"**
- **Seção de segurança** (opcional)
  - Alterar senha: senha atual, nova senha, confirmar nova senha
- **Botão "Sair"**

### Dados do backend
- `GET /api/users/profile` — carrega dados
- `PUT /api/users/profile` — salva nome e email
- `PUT /api/users/password` — altera senha (se implementado)

---

## Componentes compartilhados (para reutilizar em várias páginas)

### Topbar / Cabeçalho
- Logo
- Links de navegação
- Nome do usuário + dropdown ou botão Sair

### Sidebar (opcional)
- Links: Dashboard, Transferências, Histórico, Contas, Perfil
- Pode ser colapsável em mobile

### Card de conta
- Número, IBAN, saldo, moeda
- Usado no Dashboard e na seleção de conta na transferência

### Linha de transação
- Data, referência, valor, status
- Usado no histórico e no dashboard

### Badge de status
- Cores/símbolos para: Pendente, Processando, Concluído, Falhou, Cancelado

### Mensagem de erro / sucesso
- Área para feedback do usuário (toast, alerta, etc.)

---

## Resumo das rotas e páginas

| Rota        | Página              | Autenticada |
|------------|---------------------|-------------|
| /login     | Login               | Não         |
| /register  | Registro            | Não         |
| /forgot-password | Recuperar senha | Não  |
| /dashboard | Dashboard           | Sim         |
| /transfer  | Nova transferência   | Sim         |
| /transactions | Histórico        | Sim         |
| /transactions/:id | Detalhes da transação | Sim |
| /accounts/:id | Detalhes da conta | Sim   |
| /profile   | Perfil              | Sim         |

---

## Notas para o Figma

1. **Estados de componentes** — considere: normal, hover, focus, disabled, erro
2. **Responsividade** — defina breakpoints (mobile, tablet, desktop) se quiser
3. **Nomenclatura** — use nomes claros nas layers para facilitar a importação
4. **Variantes** — crie variantes para botões (primary, secondary, danger) e inputs (vazio, preenchido, erro)
5. **Tokens** — se usar variáveis no Figma (cores, espaçamentos), facilita manter consistência

Quando terminar o design no Figma, avise e conectamos tudo ao backend.
