# Análise de Agrupamento de MTs — Pagamentos e Mensagens

## Referência: Módulo Mensagem Livre (MT Free)

O módulo **Mensagem Livre** usa **uma única página** para 3 tipos de MT:
- **MT199** — Free Format Message (User)
- **MT299** — Free Format Message (System)
- **MT999** — Free Format Message (Network)

**Campos compartilhados:** `mtType`, `receiverBic`, `transactionReferenceNumber`, `relatedReference`, `narrativeFreeText`, `senderToReceiverInfo`

**Implementação:** Um formulário com seletor de MT Type; mesma lista; mesma API (`/api/swift/free`).

---

## Módulo Pagamentos — MTs Implementados

| MT | Estrutura | Campos principais |
|----|-----------|-------------------|
| **MT101** | Batch (múltiplas transações) | `orderingCustomer`, `executionDetails`, `transactions[]` (beneficiary, amount, currency, etc.) |
| **MT103** | Uma transação por mensagem | `orderingCustomer`, `beneficiaryCustomer`, `bankingDetails`, `:32A`, `:70`, `detailsOfCharges` |
| **MT109** | Múltiplos cheques | `orderingCustomer`, `beneficiary`, `cheques[]` (chequeNumber, amount, currency, draweeBankBic, etc.) |

---

## MTs que Compartilham os Mesmos Campos

### 1. Família MT103 — Transferência de Crédito Única

| MT | Nome | Campos |
|----|------|--------|
| **MT103** | Single Customer Credit Transfer | orderingCustomer, beneficiaryCustomer, bankingDetails, valueDate, currency, amount, bankOperationCode, remittanceInformation, detailsOfCharges |
| **MT103REMIT** | MT103+ (REMIT) | Mesmos campos + blocos opcionais REMIT |
| **MT103STP** | MT103+ (STP) | Mesmos campos + envelope STP |

**Conclusão:** MT103, MT103REMIT e MT103STP usam os **mesmos campos principais**. Podem ser agrupados em **uma página** com seletor de MT Type (como Mensagem Livre).

### 2. Família MT109 — Aviso de Cheque(s)

| MT | Nome | Campos |
|----|------|--------|
| **MT109** | Advice of Cheque(s) | orderingCustomer, beneficiary, cheques[], dateOfIssue, detailsOfCharges |
| **MT110** | Advice of Cheque(s) | Mesma estrutura |

**Conclusão:** MT109 e MT110 usam os **mesmos campos**. Podem ser agrupados em **uma página** com seletor de MT Type.

### 3. Família MT101 — Transferência Múltipla

| MT | Nome | Campos |
|----|------|--------|
| **MT101** | Request for Transfer | orderingCustomer, executionDetails, transactions[] |
| **MT102** | Multiple Customer Credit Transfer | Mesmos campos |
| **MT102STP** | MT102+ (STP) | Mesmos campos |

**Conclusão:** MT101, MT102 e MT102STP usam os **mesmos campos** (batch com múltiplas transações). Agrupados em **uma página** com seletor de MT Type.

---

## Plano de Implementação

1. **MT101 family:** Campo `mtType` (MT101 | MT102 | MT102STP); uma página para os 3 tipos. ✅
2. **MT103 family:** Campo `mtType` (MT103 | MT103REMIT | MT103STP); uma página para os 3 tipos. ✅
3. **MT109/MT110:** Campo `mtType` (MT109 | MT110); uma página para os 2 tipos. ✅
4. **Sidebar:** Itens agrupados como Mensagem Livre. ✅
5. **Mensagens (MessageFormPage):** Grupos com seletor de MT Type. ✅

---

## Grupos em Mensagens (seção Mensagens)

| Grupo | MTs | Campos compartilhados |
|-------|-----|------------------------|
| **MT105 / MT106** | EDIFACT Envelope | referenceNumber, relatedReference, narrative, BICs |
| **MT109 / MT110** | Aviso de Cheque(s) | (página dedicada /mt109) |
| **MT190 / MT290** | Advice of Charges/Interest | narrativeFields |
| **MT191 / MT291** | Request for Payment of Charges | narrativeFields |
| **MT192 / MT292** | Request for Cancellation | referenceNumber, relatedReference, cancellationReason, BICs |
| **MT195 / MT295** | Queries | referenceNumber, queryText, BICs |
| **MT196 / MT296** | Answers | referenceNumber, relatedReference, answerText, BICs |
| **MT198 / MT298** | Proprietary Message | referenceNumber, proprietaryContent, BICs |

**Não agrupados (estrutura única):** MT111, MT112, MT121, MT206, MT210, MT256
