# Nova Transferência SWIFT — Especificação (Figma)

Especificação **estrutural e funcional** da tela de nova transferência. Fluxo realista, igual a sistemas bancários corporativos. Sem design, sem estilo.

---

## 1. Fluxo geral

1. Usuário preenche dados do beneficiário e valor
2. Sistema valida IBAN e BIC em tempo real
3. Sistema calcula e exibe taxas + câmbio
4. Usuário revisa o resumo
5. Usuário confirma (modal de confirmação)
6. Sistema processa e exibe resultado (sucesso ou erro)

---

## 2. Layout da página

### Estrutura

- **Sidebar** + **Topbar** (iguais ao Dashboard)
- **Breadcrumb**: "Transferências > Nova transferência"
- **Título**: "Nova transferência SWIFT"
- **Área principal**: formulário à esquerda + resumo à direita (desktop) ou em coluna (mobile)

---

## 3. Seção: Conta de origem

### Conteúdo

- **Label**: "Debitar de"
- **Select/Dropdown** com contas do usuário
- Cada opção exibe:
  - Tipo (ex: Conta Corrente)
  - Número mascarado (ex: •••• 4521)
  - Saldo disponível
  - Moeda da conta
- **Helper**: "Saldo disponível: X.XXX,XX EUR" (atualiza ao trocar conta)
- **Validação**: bloquear envio se saldo < valor total

### Dados

- `GET /api/accounts`

---

## 4. Seção: Dados do beneficiário

### Campos

| Campo | Obrigatório | Tipo | Validação | Helper |
|-------|-------------|------|-----------|--------|
| IBAN | Sim | Texto | Formato + checksum | Formato: XX00 0000 0000 0000 0000 00 |
| BIC/SWIFT | Sim | Texto | 8 ou 11 caracteres | Ex: COBADEFFXXX |
| Nome do beneficiário | Sim | Texto | — | Nome completo como no banco |
| Banco do beneficiário | Não | Texto | — | Nome do banco (opcional) |

### Comportamento IBAN

- Formatação automática em grupos de 4 caracteres
- Validação ao sair do campo (blur) ou ao clicar em "Validar"
- Feedback: "IBAN válido" ou "IBAN inválido" + mensagem de erro
- Botão "Validar IBAN" (opcional, se não for automático)

### Comportamento BIC

- Validação ao sair do campo ou ao clicar em "Validar"
- Feedback: "BIC válido" ou "BIC inválido"
- Pode exibir nome do banco se a API retornar
- Botão "Validar BIC" (opcional)

### Dados

- `POST /api/validate/iban` com `{ iban }`
- `POST /api/validate/bic` com `{ bic }`

---

## 5. Seção: Valor e moeda

### Campos

| Campo | Obrigatório | Tipo | Comportamento |
|-------|-------------|------|---------------|
| Valor | Sim | Numérico | Formatação com separador de milhar e decimal |
| Moeda | Sim | Select | USD, EUR, GBP, CHF, BRL, JPY, etc. |

### Comportamento

- Se moeda do destinatário ≠ moeda da conta origem:
  - Exibir taxa de câmbio
  - Exibir "Equivalente a: X.XXX,XX EUR" (ou moeda de destino)
  - Taxa com data/hora (ex: "Taxa de 13/02/2025 14:32")
- Se moeda igual: sem conversão
- Validação: valor > 0, valor ≤ saldo disponível

### Dados

- `GET /api/exchange/rates` (base, symbols)

---

## 6. Seção: Propósito e referência

### Campos

| Campo | Obrigatório | Tipo | Comportamento |
|-------|-------------|------|---------------|
| Propósito / Referência | Não | Texto | Campo livre, ex: "Pagamento fatura 123" |
| Categoria SEPA | Não | Select | Só para EUR/SEPA |

### Opções Categoria SEPA

- Salário (SALA)
- Bens e serviços (CORT)
- Fornecedor (SUPP)
- Governo (GOVT)
- Outro (OTHR)

### Comportamento

- Categoria SEPA visível apenas se moeda = EUR
- Se oculto, enviar OTHR como padrão

---

## 7. Seção: Resumo da transferência (painel lateral ou abaixo)

### Conteúdo

- **Você envia**: valor + moeda (ex: 1.500,00 EUR)
- **Taxa de câmbio** (se houver): ex: "1 EUR = 1,08 USD"
- **Taxa da transferência**: valor fixo (ex: 25,00 EUR)
- **Total debitado**: valor + taxa (ex: 1.525,00 EUR)
- **Beneficiário recebe**: valor na moeda de destino (se diferente)
- **Data estimada**: ex: "Disponível em 1-2 dias úteis"

### Comportamento

- Atualização em tempo real ao alterar valor, moeda ou conta
- Destaque para o total debitado
- Alert se valor > limite diário (se houver)

---

## 8. Botões de ação

### Ordem (esquerda → direita)

1. **Cancelar** — volta ao Dashboard ou Histórico
2. **Validar** — valida IBAN e BIC (se não for automático)
3. **Continuar** ou **Revisar** — avança para etapa de confirmação
4. **Confirmar transferência** — abre modal de confirmação

### Estados

- Desabilitar "Confirmar" se:
  - IBAN ou BIC inválidos
  - Saldo insuficiente
  - Campos obrigatórios vazios
- Loading durante validação e durante envio
- Desabilitar todos durante envio

---

## 9. Modal de confirmação

### Conteúdo

- **Título**: "Confirmar transferência"
- **Resumo**:
  - De: conta origem (número mascarado)
  - Para: nome beneficiário, IBAN
  - Valor: X.XXX,XX EUR
  - Taxa: XX,XX EUR
  - Total: X.XXX,XX EUR
  - Propósito: texto informado
- **Checkbox**: "Li e aceito os termos da transferência" (opcional)
- **Botões**: "Voltar" | "Confirmar e enviar"

### Comportamento

- Fechar ao clicar em "Voltar" ou fora
- Ao confirmar: `POST /api/transfers` com os dados
- Loading no botão durante envio
- Fechar modal e exibir resultado (toast ou redirect)

---

## 10. Feedback pós-envio

### Sucesso

- Toast: "Transferência criada com sucesso"
- Exibir número de referência SWIFT
- Botão "Ver detalhes" → página de detalhes da transação
- Redirecionar para Histórico ou Detalhes (conforme UX)

### Erro

- Toast ou alert com mensagem do backend
- Ex: "Saldo insuficiente", "IBAN inválido", "Erro ao processar"
- Manter dados do formulário para correção
- Modal permanece fechada

---

## 11. Validações e mensagens

### IBAN

- "IBAN inválido"
- "IBAN não encontrado" (se API retornar)
- "Formato inválido para o país"

### BIC

- "BIC inválido"
- "BIC não encontrado"

### Valor

- "Valor deve ser maior que zero"
- "Saldo insuficiente"
- "Valor excede o limite diário"

### Geral

- "Preencha todos os campos obrigatórios"
- "Valide o IBAN e BIC antes de continuar"

---

## 12. Estados da tela

- **Inicial**: formulário vazio, resumo zerado
- **Preenchendo**: campos com dados parciais
- **Validando**: spinner em IBAN/BIC
- **Validado**: feedback verde em IBAN e BIC
- **Erro de validação**: mensagens de erro nos campos
- **Pronto para confirmar**: todos válidos, botão habilitado
- **Confirmando**: modal aberta
- **Enviando**: loading no botão
- **Sucesso**: toast + redirect
- **Erro no envio**: toast de erro

---

## 13. Responsividade

### Desktop

- Formulário e resumo lado a lado
- Resumo fixo ou sticky ao rolar

### Tablet

- Formulário e resumo em coluna
- Resumo abaixo do formulário

### Mobile

- Campos em coluna única
- Resumo colapsável ou sempre visível abaixo
- Botões em coluna (um abaixo do outro)
- Modal em tela cheia ou quase

---

## 14. Extras realistas (opcional)

- **Salvar beneficiário**: checkbox "Salvar para transferências futuras"
- **Beneficiários salvos**: select com lista de beneficiários salvos
- **Banco intermediário**: campos para transferências que exigem
- **Referência do pagamento**: campo estruturado (ex: REF+...)
- **Instruções adicionais**: campo texto livre
- **Aviso de moeda**: "O destinatário pode receber em [moeda] conforme o banco dele"

---

## 15. Checklist de componentes

- [ ] Select conta de origem
- [ ] Campo IBAN com validação
- [ ] Campo BIC com validação
- [ ] Campo nome beneficiário
- [ ] Campo valor
- [ ] Select moeda
- [ ] Campo propósito
- [ ] Select categoria SEPA (condicional)
- [ ] Painel resumo (você envia, taxa, total, beneficiário recebe)
- [ ] Botão Cancelar
- [ ] Botão Validar
- [ ] Botão Continuar/Revisar
- [ ] Botão Confirmar transferência
- [ ] Modal de confirmação
- [ ] Checkbox termos (opcional)
- [ ] Toast sucesso
- [ ] Toast erro
- [ ] Mensagens de validação por campo
- [ ] Loading states

---

## 16. Dados do backend

| Ação | Endpoint | Quando |
|------|----------|--------|
| Carregar contas | GET /api/accounts | Ao abrir a página |
| Validar IBAN | POST /api/validate/iban | Ao sair do campo ou clicar Validar |
| Validar BIC | POST /api/validate/bic | Ao sair do campo ou clicar Validar |
| Taxas de câmbio | GET /api/exchange/rates | Ao abrir e ao trocar moeda |
| Criar transferência | POST /api/transfers | Ao confirmar no modal |

**Payload POST /api/transfers:**
```json
{
  "sourceAccountId": 1,
  "destinationIban": "DE44500105170445678901",
  "destinationBic": "COBADEFFXXX",
  "destinationHolderName": "Nome do Beneficiário",
  "amount": 1500.00,
  "currency": "EUR",
  "purpose": "Pagamento de serviço",
  "categoryPurpose": "OTHR"
}
```

---

*Especificação estrutural e funcional. Design e estilo a critério do designer.*
