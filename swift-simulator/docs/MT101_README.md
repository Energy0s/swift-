# MT101 — Request for Transfer

Módulo completo MT101 com backend, frontend, validações e auditoria.

## Endpoints API

Base: `POST/GET/PUT /api/swift/mt101`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /messages | Cria mensagem (status Draft) |
| GET | /messages | Lista com filtros e paginação |
| GET | /messages/:id | Detalhamento completo |
| PUT | /messages/:id | Edita (apenas Draft/Repair) |
| POST | /messages/:id/validate | Valida tags obrigatórias |
| POST | /messages/:id/submit-approval | Muda para Pending Approval |
| POST | /messages/:id/approve | 4-eyes: dois aprovadores |
| POST | /messages/:id/release | Libera para SWIFT |
| POST | /messages/:id/ack | Registra ACK |
| POST | /messages/:id/nack | Registra NACK |
| POST | /messages/:id/cancel | Solicita cancelamento |
| GET | /messages/:id/fin | Retorna mensagem FIN formatada |

## Fluxo de Status

```
Draft → Validated → Pending Approval → Approved → Released to SWIFT
                                                      ↓
                                            ACK Received / NACK Received
                                                      ↓
                                            Completed / Under Investigation
```

## Campos Obrigatórios

- **:20** Transaction Reference Number
- **:28D** Message Index/Total (quando múltiplas transações)
- **:30** Requested Execution Date (>= hoje)
- **:32B** Currency + Amount por transação
- **:59** Beneficiary (nome ou IBAN)
- **:71A** Details of Charges (OUR/SHA/BEN)
- **:70** Remittance Information máx 140 caracteres

## Validações

- Amount > 0, Currency ISO
- 4-eyes: Approved By 1 ≠ Approved By 2
- Imutabilidade pós-release
- Auditoria em todas as mudanças

## Persistência

Dados em `data/mt101.json` (backend). Estrutura compatível com migração para PostgreSQL.
