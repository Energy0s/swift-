# SWIFT MT — Tipos e Campos Completos

Especificação profissional de todos os tipos MT relevantes para o simulador. Campos obrigatórios e opcionais conforme padrão SWIFT.

---

## Categorias SWIFT MT

| Cat | Faixa | Descrição |
|-----|-------|-----------|
| 0 | MT0xx | Mensagens do sistema |
| 1 | MT1xx | Pagamentos de cliente e cheques |
| 2 | MT2xx | Transferências entre instituições financeiras |
| 3 | MT3xx | Mercados de tesouraria |
| 9 | MT9xx | Gestão de caixa e extratos |

---

## MT103 — Single Customer Credit Transfer

Transferência de crédito individual de cliente. O mais usado para pagamentos internacionais.

### Campos obrigatórios

| Tag | Nome | Formato | Descrição |
|-----|------|---------|-----------|
| **20** | Transaction Reference | 16x | Referência única do ordenante (Sender's Reference) |
| **23B** | Bank Operation Code | 4!a | CRED, SPAY, SSTD ou SPRI |
| **32A** | Value Date/Currency/Amount | 6!n3!a15d | Data (YYMMDD) + Moeda + Valor |
| **50a** | Ordering Customer | K ou F | Ordenante (pagador) |
| **59a** | Beneficiary Customer | /34x + 35x | Beneficiário (recebedor) |

### Campos opcionais

| Tag | Nome | Descrição |
|-----|------|-----------|
| **23E** | Instruction Code | Código de instrução (ex: PHOB, PHOI) |
| **26T** | Transaction Type | Tipo de transação |
| **33B** | Currency/Instructed Amount | Valor em moeda diferente |
| **36** | Exchange Rate | Taxa de câmbio |
| **50a** | Ordering Customer | Detalhes do ordenante |
| **51A** | Sender's Correspondent | Banco correspondente do ordenante |
| **52A** | Ordering Institution | Instituição ordenante |
| **53A** | Sender's Correspondent | Correspondente do remetente |
| **54A** | Receiver's Correspondent | Correspondente do destinatário |
| **56A** | Intermediary | Intermediário |
| **57A** | Account With Institution | Conta na instituição |
| **59a** | Beneficiary Customer | Detalhes do beneficiário |
| **70** | Remittance Information | Informação de remessa (propósito) |
| **71A** | Details of Charges | OUR, BEN, SHA |
| **71F** | Sender's Charges | Taxas do remetente |
| **71G** | Receiver's Charges | Taxas do destinatário |
| **72** | Sender to Receiver Information | Informação entre bancos |
| **77B** | Regulatory Reporting | Relatório regulatório |

### Códigos 23B (Bank Operation Code)

| Código | Descrição |
|--------|-----------|
| CRED | Crédito normal, sem nível de serviço SWIFT |
| SPAY | SWIFT Pay Service Level |
| SSTD | SWIFT Standard Service Level |
| SPRI | SWIFT Priority Service Level |

### Códigos 71A (Details of Charges)

| Código | Descrição |
|--------|-----------|
| OUR | Todas as taxas pagas pelo ordenante |
| BEN | Todas as taxas pagas pelo beneficiário |
| SHA | Taxas compartilhadas |

---

## MT202 — General Financial Institution Transfer

Transferência entre instituições financeiras (banco a banco).

### Campos obrigatórios

| Tag | Nome | Descrição |
|-----|------|-----------|
| **20** | Transaction Reference | Referência da transação |
| **21** | Related Reference | Referência relacionada |
| **32A** | Value Date/Currency/Amount | Data, moeda, valor |
| **53a** | Sender's Correspondent | Correspondente do remetente |
| **58a** | Beneficiary Institution | Instituição beneficiária |

---

## MT940 — Customer Statement Message

Extrato de conta para o cliente.

### Campos principais

| Tag | Nome | Descrição |
|-----|------|-----------|
| **20** | Transaction Reference | Referência |
| **25** | Account Identification | Identificação da conta |
| **28C** | Statement Number | Número do extrato |
| **60F** | Opening Balance | Saldo de abertura |
| **61** | Statement Line | Linha do extrato |
| **62F** | Closing Balance | Saldo de fechamento |
| **64** | Closing Available Balance | Saldo disponível |
| **65** | Forward Available Balance | Saldo futuro |

---

## MT101 — Request for Transfer

Solicitação de transferência (múltipla).

### Campos principais

| Tag | Nome | Descrição |
|-----|------|-----------|
| **20** | Sender's Reference | Referência do remetente |
| **21** | Related Reference | Referência relacionada |
| **32A** | Value Date/Currency/Amount | Data, moeda, valor |
| **50a** | Ordering Customer | Ordenante |
| **59a** | Beneficiary Customer | Beneficiário |

---

## Formulário de Nova Transferência — Campos SWIFT

O formulário deve mapear para os campos MT103:

| Campo no formulário | Tag MT | Obrigatório |
|--------------------|--------|-------------|
| Referência da transação | 20 | Sim |
| Código de operação (23B) | 23B | Sim |
| Conta de origem | 50K | Sim |
| IBAN destinatário | 59 | Sim |
| Nome beneficiário | 59 | Sim |
| BIC destinatário | 57A/58A | Sim |
| Valor | 32A | Sim |
| Moeda | 32A | Sim |
| Data valor | 32A | Sim |
| Propósito/Remessa | 70 | Não |
| Detalhes de taxas (71A) | 71A | Não |

---

## Dashboard SWIFT — Elementos Profissionais

### Barra de status (topo)
- **Relógio** — Data/hora atual (UTC e local)
- **Status da rede** — FIN Core: Operacional / Manutenção
- **Fila de mensagens** — Pendentes: X | Enviadas hoje: Y
- **Sessão** — Usuário logado, tempo de sessão

### Área principal
- Resumo de contas
- Últimas mensagens (MT103, MT202)
- Ações rápidas
- Alertas (mensagens pendentes, erros)

---

*Documento de referência para implementação profissional do simulador SWIFT.*
