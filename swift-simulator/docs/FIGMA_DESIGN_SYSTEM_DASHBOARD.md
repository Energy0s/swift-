# Componentes do Dashboard — SWIFT Transfer (Figma)

Documento **estrutural e funcional** — sem design, sem estilo. Lista todos os componentes que o dashboard precisa ter. O visual fica por sua conta.

---

## 1. Layout Principal

### Estrutura

- **Topbar** — barra superior fixa
- **Sidebar** — menu lateral (expandível/colapsável em tablet)
- **Área de conteúdo** — onde fica o conteúdo da página
- **Breakpoints**: desktop (sidebar visível), tablet (sidebar colapsada), mobile (sidebar em drawer)

---

## 2. Sidebar

### Conteúdo

- **Logo / nome do app** no topo
- **Itens de menu** (cada um com ícone + texto):
  - Dashboard
  - Transferências
  - Histórico
  - Contas
  - Perfil
- **Estados por item**: default, hover, active (página atual)
- **Modo colapsado** (tablet): só ícones
- **Separador** entre seções (se houver)
- **Área inferior** (opcional): ajuda, versão, etc.

---

## 3. Topbar

### Conteúdo

- **Breadcrumb** (opcional): ex. "Dashboard" ou "Transferências > Nova"
- **Busca** (opcional): campo para buscar transferências
- **Notificações**: ícone + badge com número
- **Menu do usuário**: avatar + nome + dropdown
  - Dropdown: Perfil, Configurações, Sair

---

## 4. Botões

### Tipos

- **Primary** — ação principal (ex: Confirmar, Enviar)
- **Secondary** — ação secundária (ex: Cancelar, Voltar)
- **Ghost** — ação terciária
- **Danger** — ação destrutiva (ex: Cancelar transferência, Excluir)
- **Icon** — só ícone, sem texto

### Estados

- Default, Hover, Active, Disabled, Loading (com spinner)

### Tamanhos

- Small, Medium, Large (definir conforme necessidade)

---

## 5. Cards

### Account Card (conta bancária)

- Título do tipo de conta
- Número mascarado (ex: •••• 4521)
- IBAN (com botão copiar)
- Saldo
- Moeda
- BIC
- Clicável para detalhes da conta

### Transaction Card (transação)

- Ícone de status
- Descrição / referência
- Valor
- Moeda
- Status (badge)
- Clicável para detalhes

### Dashboard Card (genérico)

- Título
- Conteúdo (texto, lista, etc.)

### Stat Card (métrica)

- Título
- Valor principal
- Variação (opcional): ex. +5%

---

## 6. Tabelas

### Colunas (tabela de transações)

- Data
- Nº referência
- Destinatário
- Valor
- Moeda
- Status
- Ações (ex: ver detalhes)

### Comportamento

- Header fixo ao rolar
- Hover na linha
- Paginação (anterior, números, próxima)
- Texto tipo "Mostrando 1–10 de X"

---

## 7. Formulários e Inputs

### Input

- Label
- Campo de texto
- Placeholder
- Helper text (opcional)
- Estados: default, focus, error, disabled

### Select / Dropdown

- Label
- Campo com seta
- Lista de opções ao clicar
- Scroll se muitas opções

### IBAN Field

- Campo com formatação em grupos
- Ícone de validação (válido / inválido)
- Botão copiar (opcional)

### BIC Field

- Campo texto
- Ícone de validação (opcional)

### Currency Field

- Prefixo com moeda
- Formatação numérica
- Alinhamento à direita

---

## 8. Modais e Popups

### Modal base

- Overlay (backdrop escuro)
- Container central
- Botão fechar (X)
- Header (título)
- Body (conteúdo)
- Footer (botões)

### Confirmation Dialog

- Ícone (aviso ou perigo)
- Título
- Mensagem
- Botões: Cancelar, Confirmar

### Dropdown Menu (popover)

- Lista de itens
- Separadores entre grupos
- Hover em cada item
- Fecha ao clicar fora

---

## 9. Badges e Status

### Status da transação

- Concluído
- Processando
- Pendente
- Falhou
- Cancelado

Cada um com rótulo e indicador visual (cor, ícone, etc. — a seu critério).

### Badge numérico

- Para notificações (ex: número de alertas)
- Posicionado no canto do ícone

---

## 10. Feedback e Loading

### Spinner

- Tamanhos: pequeno, médio, grande
- Uso: botões em loading, telas carregando

### Skeleton

- Placeholder animado para cards e linhas de tabela

### Toast / Snackbar

- Mensagem temporária (ex: "Transferência criada")
- Ícone (sucesso, erro, aviso)
- Botão fechar
- Posição: canto da tela (ex: inferior direito)

### Alert (inline)

- Título
- Descrição
- Ícone (sucesso, aviso, erro)
- Pode ser dismissível

---

## 11. Componentes SWIFT

### SWIFT Message Viewer

- Área para exibir mensagem (MT103, XML, etc.)
- Fonte monospace
- Botão copiar
- Scroll se o texto for longo

### Status Timeline

- Lista vertical de etapas
- Cada etapa: status, data/hora, descrição
- Indicador de progresso (ex: linha conectando etapas)

### Format Selector

- Seletor de formato: xml, mt103, sepa-epc-ct, cbpr, rtgs, fednow, sic-eurosic, bahtnet
- Estilo: tabs, segmented control ou dropdown — a seu critério

---

## 12. Ícones necessários

- Dashboard
- Transferências
- Histórico
- Contas
- Perfil
- Sair
- Notificações
- Buscar
- Copiar
- Fechar
- Chevron (dropdown)
- Sucesso
- Erro
- Aviso
- Ver detalhes / expandir

---

## 13. Checklist de componentes

- [ ] Sidebar (expandida + colapsada)
- [ ] Topbar
- [ ] Menu do usuário (dropdown)
- [ ] Botões (todos os tipos + estados)
- [ ] Account Card
- [ ] Transaction Card
- [ ] Dashboard Card
- [ ] Stat Card
- [ ] Tabela (header, linhas, paginação)
- [ ] Input (todos os estados)
- [ ] Select
- [ ] IBAN Field
- [ ] Currency Field
- [ ] Modal base
- [ ] Confirmation Dialog
- [ ] Dropdown Menu
- [ ] Badges de status
- [ ] Spinner
- [ ] Skeleton
- [ ] Toast
- [ ] Alert
- [ ] SWIFT Message Viewer
- [ ] Status Timeline
- [ ] Format Selector

---

*Estrutura e funcionalidade apenas. Design e estilo ficam a cargo do designer.*
