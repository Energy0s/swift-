# Frontend — Aplicar Tudo

Documento único para implementar o frontend completo: sidebar, topbar, popups, páginas, APIs, animações. Ordem de implementação e o que cada parte precisa.

---

## Ordem de implementação

1. Layout base (Sidebar + Topbar)
2. Páginas (Dashboard, Nova transferência, Histórico, Detalhes, Perfil)
3. Popups e modais
4. Integração com APIs
5. Animações e loading

---

## 1. Layout base

### 1.1 Sidebar

**Conteúdo:**
- Logo / "SWIFT Transfer" no topo
- Itens: Dashboard, Transferências, Histórico, Contas, Perfil
- Cada item: ícone + texto
- Estados: default, hover, active (página atual)
- Tablet: colapsada (só ícones)
- Mobile: drawer (abre ao clicar no menu)

**Rotas:**
- Dashboard → `/dashboard`
- Transferências → `/transfer`
- Histórico → `/transactions`
- Contas → `/accounts` ou `/dashboard` (contas no dashboard)
- Perfil → `/profile`

### 1.2 Topbar

**Conteúdo:**
- Breadcrumb (ex: "Dashboard" ou "Transferências > Nova")
- Notificações (ícone + badge)
- Menu usuário: avatar + nome + dropdown
  - Dropdown: Perfil, Sair

### 1.3 Área de conteúdo

- Padding ao redor
- Conteúdo muda conforme a rota

---

## 2. Páginas

### 2.1 Dashboard (`/dashboard`)

**Componentes:**
- Título: "Dashboard"
- Cards de contas (Account Card)
  - Número mascarado, IBAN, saldo, moeda
  - Cada card clicável → `/accounts/:id`
- Tabela ou lista: últimas transações
  - Colunas: Data, Referência, Destinatário, Valor, Status
  - Cada linha clicável → `/transactions/:id`
- Botão "Nova transferência" → `/transfer`

**APIs:**
- `GET /api/accounts`
- `GET /api/transfers?limit=5`

### 2.2 Nova transferência (`/transfer`)

**Componentes:**
- Breadcrumb: "Transferências > Nova"
- Título: "Nova transferência SWIFT"
- Formulário: conta origem, IBAN, BIC, nome beneficiário, valor, moeda, propósito
- Painel resumo: você envia, taxa, total, beneficiário recebe
- Botões: Cancelar, Validar, Confirmar transferência

**BIC com autocomplete:**
- Ao digitar no campo BIC: `GET /api/banks/search?q=COBA`
- Exibir dropdown com sugestões (bic, name, city)
- Ao selecionar: preencher BIC e exibir nome do banco
- Ao validar: `POST /api/validate/bic` com `{ bic }` → exibir nome, cidade, país

**APIs:**
- `GET /api/accounts`
- `GET /api/banks/search?q=...`
- `POST /api/validate/iban`
- `POST /api/validate/bic`
- `GET /api/exchange/rates`
- `POST /api/transfers`

### 2.3 Histórico (`/transactions`)

**Componentes:**
- Título: "Histórico de transações"
- Filtros: por status (Todos, Pendente, Concluído, Falhou)
- Tabela: Data, Referência, Destinatário, Valor, Moeda, Status, Ações
- Paginação: anterior, números, próxima
- Texto: "Mostrando 1-10 de X"
- Botão "Nova transferência"

**APIs:**
- `GET /api/transfers?page=1&limit=10&status=...`

### 2.4 Detalhes da transação (`/transactions/:id`)

**Componentes:**
- Botão "Voltar" → `/transactions`
- Informações: referência, status, data, conta origem, destinatário, valor, taxa, total, propósito
- Timeline de status (criado → processando → concluído)
- Mensagem SWIFT: área com seletor de formato
  - Formatos: xml, mt103, mt202, sepa-epc-ct, cbpr, rtgs, fednow, sic-eurosic, bahtnet
  - Botão copiar

**APIs:**
- `GET /api/transfers/:id`
- `GET /api/transfers/:id/swift-message?format=mt103` (ou outro)

### 2.5 Detalhes da conta (`/accounts/:id`)

**Componentes:**
- Informações: número, IBAN, BIC, saldo, moeda, limite diário
- Lista de transações dessa conta
- Botão "Extrato MT940" → baixar ou exibir
- Botão "Nova transferência"

**APIs:**
- `GET /api/accounts/:id`
- `GET /api/transfers?accountId=...` (filtrar por conta)
- `GET /api/accounts/:id/statement?format=mt940`

### 2.6 Perfil (`/profile`)

**Componentes:**
- Campos: nome, email
- Botão "Salvar alterações"
- Botão "Sair"

**APIs:**
- `GET /api/users/profile`
- `PUT /api/users/profile`

---

## 3. Popups e modais

### 3.1 Modal de confirmação (transferência)

**Quando:** ao clicar em "Confirmar transferência"

**Conteúdo:**
- Título: "Confirmar transferência"
- Resumo: de, para, valor, taxa, total, propósito
- Checkbox: "Li e aceito os termos" (opcional)
- Botões: "Voltar" | "Confirmar e enviar"

**Comportamento:**
- Fechar ao clicar em Voltar ou fora
- Ao confirmar: chamar `POST /api/transfers` com loading no botão
- Sucesso: fechar modal, exibir toast, redirecionar para detalhes ou histórico
- Erro: exibir toast de erro, manter modal aberta

### 3.2 Toast (sucesso)

**Quando:** após transferência criada

**Conteúdo:**
- Ícone sucesso
- Mensagem: "Transferência criada com sucesso"
- Número de referência
- Botão "Ver detalhes" (opcional)

### 3.3 Toast (erro)

**Quando:** API retorna erro

**Conteúdo:**
- Ícone erro
- Mensagem do backend
- Botão "Tentar novamente" (opcional)

### 3.4 Dropdown menu do usuário

**Quando:** ao clicar no avatar/nome na topbar

**Conteúdo:**
- Perfil
- Sair
- Fecha ao clicar fora

### 3.5 Dropdown autocomplete BIC

**Quando:** ao digitar no campo BIC

**Conteúdo:**
- Lista de bancos (bic, name, city)
- Ao selecionar: preencher campo e exibir nome do banco abaixo
- Fecha ao selecionar ou clicar fora

### 3.6 Modal de confirmação genérica

**Quando:** ações destrutivas (cancelar, excluir)

**Conteúdo:**
- Título
- Mensagem
- Botões: Cancelar | Confirmar

---

## 4. Integração com APIs

### 4.1 Base URL

```
http://localhost:3001/api
```

### 4.2 Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

### 4.3 Endpoints por página

| Página | Endpoints |
|--------|-----------|
| Auth | POST /auth/login, /auth/register, /auth/logout |
| Dashboard | GET /accounts, GET /transfers?limit=5 |
| Nova transferência | GET /accounts, GET /banks/search, POST /validate/iban, POST /validate/bic, GET /exchange/rates, POST /transfers |
| Histórico | GET /transfers?page=&limit=&status= |
| Detalhes transação | GET /transfers/:id, GET /transfers/:id/swift-message?format= |
| Detalhes conta | GET /accounts/:id, GET /accounts/:id/statement?format=mt940 |
| Perfil | GET /users/profile, PUT /users/profile |

### 4.4 Formatos de mensagem SWIFT

`GET /api/transfers/:id/swift-message?format=`

| format | Retorno |
|--------|---------|
| xml | pacs.008 |
| mt103 | MT103 |
| mt202 | MT202 |
| sepa-epc-ct | SEPA |
| cbpr | CBPR+ |
| rtgs | TARGET2 |
| fednow | FedNow |
| sic-eurosic | SIC/euroSIC |
| bahtnet | BAHTNET |

---

## 5. Animações e loading

### 5.1 Barra de progresso (transferência)

Ao clicar "Confirmar e enviar" no modal:
- 0% → 20%: "Validando"
- 20% → 50%: "Gerando mensagem"
- 50% → 80%: "Enviando"
- 80% → 100%: "Concluído"
- Simular com setTimeout (ex: 500ms por etapa)

### 5.2 Skeleton loading

- Cards do dashboard: retângulos animados enquanto carrega
- Tabela do histórico: linhas fantasma enquanto carrega
- Tabela de transações: linhas com placeholder

### 5.3 Spinner nos botões

- Botão "Confirmar" (login, registro, transferência)
- Durante a chamada: spinner dentro do botão, texto "Enviando...", desabilitado

### 5.4 Toast

- Entrada: slide ou fade
- Saída: fade após 5s ou ao clicar fechar

---

## 6. Checklist de implementação

### Layout
- [ ] Sidebar com itens de menu
- [ ] Sidebar colapsada (tablet)
- [ ] Sidebar drawer (mobile)
- [ ] Topbar com breadcrumb
- [ ] Topbar com menu usuário (dropdown)
- [ ] Topbar com notificações

### Páginas
- [ ] Dashboard (cards contas + tabela transações)
- [ ] Nova transferência (formulário + resumo)
- [ ] Histórico (tabela + filtros + paginação)
- [ ] Detalhes da transação (info + timeline + mensagem SWIFT)
- [ ] Detalhes da conta (info + transações + extrato MT940)
- [ ] Perfil (formulário editar)

### Popups
- [ ] Modal confirmação transferência
- [ ] Toast sucesso
- [ ] Toast erro
- [ ] Dropdown menu usuário
- [ ] Dropdown autocomplete BIC

### APIs
- [ ] Cliente HTTP com auth (Bearer token)
- [ ] Interceptor para 401 (redirect login)
- [ ] GET /accounts
- [ ] GET /transfers
- [ ] POST /transfers
- [ ] GET /transfers/:id
- [ ] GET /transfers/:id/swift-message?format=
- [ ] GET /banks/search?q=
- [ ] POST /validate/iban
- [ ] POST /validate/bic
- [ ] GET /exchange/rates
- [ ] GET /accounts/:id/statement?format=mt940

### Loading
- [ ] Barra de progresso na transferência
- [ ] Skeleton nos cards
- [ ] Skeleton na tabela
- [ ] Spinner nos botões
- [ ] Toast com animação

### BIC
- [ ] Autocomplete no campo BIC (GET /banks/search)
- [ ] Exibir nome do banco ao validar (POST /validate/bic)

---

## 7. Estrutura de pastas sugerida

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── Layout.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx
│   │   └── ProgressBar.tsx
│   ├── cards/
│   │   ├── AccountCard.tsx
│   │   └── TransactionCard.tsx
│   └── forms/
│       ├── BicField.tsx  (com autocomplete)
│       └── IbanField.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Transfer.tsx
│   ├── Transactions.tsx
│   ├── TransactionDetail.tsx
│   ├── AccountDetail.tsx
│   └── Profile.tsx
├── api/
│   ├── client.ts
│   └── endpoints.ts
└── routes/
    └── AppRoutes.tsx
```

---

## 8. Resumo de rotas

| Rota | Página | Auth |
|------|--------|------|
| /login | Login | Não |
| /register | Registro | Não |
| /dashboard | Dashboard | Sim |
| /transfer | Nova transferência | Sim |
| /transactions | Histórico | Sim |
| /transactions/:id | Detalhes transação | Sim |
| /accounts/:id | Detalhes conta | Sim |
| /profile | Perfil | Sim |

---

*Documento para aplicar tudo no frontend. Sidebar, topbar, popups, páginas, APIs, loading. Sem design — estilo a seu critério.*
