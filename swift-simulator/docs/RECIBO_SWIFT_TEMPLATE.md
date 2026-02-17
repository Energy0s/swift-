# Recibo SWIFT — Cópia de Envio (Customer Copy)

**Sistema:** SWIFT Transfer (VHS INVESTIMENTOS S.A.)

## Cabeçalho Institucional — VHS INVESTIMENTOS S.A.

**VHS INVESTIMENTOS S.A.**  
CNPJ: 61.600.361/0001-63  
ENDEREÇO: AL DOUTOR CARLOS DE CARVALHO, 417 - SALA 9  
TELEFONE: (41) 3205-4347  
INSC. ESTADUAL: ISENTO  
INSC. MUNICIPAL: 12536471  

**SWIFT/BIC:** BOMGBRS1XXX  
*Banco Emissor / Session Holder*

---

## PÁGINA 1 — CAMPOS

### Metadados do Documento
| Campo | Valor |
|-------|-------|
| Data/Hora do Documento | |
| Banco Emissor (Nome) | VHS INVESTIMENTOS S.A. |
| Tipo/Perfil do Documento | Customer Copy |
| Instance Type and Transmission | |
| Tipo de Mensagem | MT-103 / Single Customer Credit Transfer |
| Canal/Meio de Transmissão | via Brussels SWIFT System |
| Session Holder (BIC) | BOMGBRS1XXX |
| Destination Routing | |
| Notification / History / Transmission Status | |
| Network Delivery Status | |
| Priority / Delivery | |
| Message Input Reference | |
| Message Output Reference | |

### MESSAGE HEADER
| Campo | Valor |
|-------|-------|
| SWIFT Input (tipo de mensagem) | MT103 |

### SENDER (BANCO EMISSOR)
| Campo | Valor |
|-------|-------|
| Sender SWIFT/BIC | BOMGBRS1XXX |
| Sender Bank Name | VHS INVESTIMENTOS S.A. |
| Sender Bank Address | AL DOUTOR CARLOS DE CARVALHO, 417 - SALA 9 |
| Sender Account Name | |
| Applicant/Ordering Customer Address | |
| Sender Account Number | |
| Sender IBAN Number | |
| Código/Tracking/Barcode | |

### RECEIVER (BANCO RECEPTOR)
| Campo | Valor |
|-------|-------|
| Receiver SWIFT/BIC | |
| Receiver Bank Name | |
| Receiver Bank Address | |
| Receiver Account Name | |
| Receiver Account Number | |

### MESSAGE TEXT (TAGS)
| Tag | Descrição | Valor |
|-----|-----------|-------|
| F21 / :21: | Validation/Authentication / Reference | |
| F20 / :20: | Sender's Reference | |
| Value Date | Data valor | |
| Value Amount | Valor informado | |
| F23B / :23B: | Bank Operation Code | |
| F31C / :31C: | Date of Issue | |
| F32A / :32A: | Value Date / Currency / Interbank Settled Amount | |
| F32B / :32B: | Currency / Amount | |
| F51A / :51A: | Sender / Ordering Institution | |
| F56A / :56A: | Intermediary / Correspondent Bank | |
| F57A / :57A: | Account With Institution | |
| F59 / :59: | Beneficiary Customer / Address | |

### BENEFICIARY CUSTOMER/ADDRESS
| Campo | Valor |
|-------|-------|
| Beneficiary Name | |
| Beneficiary Address Lines | |
| Beneficiary City | |
| Beneficiary Country | |

---

## PÁGINA 2 — CAMPOS

| Campo | Valor |
|-------|-------|
| :72A: Narrative | Texto narrativo |
| Confirmação de liberação de pagamento ao beneficiário | |
| Declaração de origem/limpeza dos fundos | |
| Declaração de responsabilidade legal | |
| Cláusulas/declarações adicionais | |
| Aviso ao beneficiário | |
| Record Information (MAC / PAC / PEG / ENC / CHK / INT / PED) | |
| Recorded Date | |
| Authenticated (status) | |
| Message Number / ID | |

| Tag | Descrição | Valor |
|-----|-----------|-------|
| F71A / :71A: | Details of Charges | |
| F72 / :72: | Sender to Receiver Information | |
| Valor/descrição do propósito no campo 72 | |
| Dados do beneficiário no campo 72 | |
| Dados do remetente no campo 72 | |
| Date Recorded | |
| Sender's Reference (repetição) | |

### Assinatura/Identificação institucional
*For and on behalf of VHS INVESTIMENTOS S.A.*

| Campo | Valor |
|-------|-------|
| Authorized Officer 1 (nome/cargo) | |
| Authorized Officer 2 (nome/cargo) | |

### MESSAGE TRAILER
| Campo | Valor |
|-------|-------|
| {CHK:} Checksum/Trailer Code | |
| PKI Signature / MAC-equivalent Tracking Code | |
| Intervention / Category | |
| Creation Time | |
| Application | |
| Operation | |
| System End Time | |
| Text/Route Summary (blocos técnicos) | |
| Confirmation Date/Time | |
| Message Number / Title | |
| Logical Answer Back (Y/N) | |
| Value Date / End Time | |
| Transmission Result / Status | transmitted/received |
| End of Message | |

---

## Mapeamento por Tipo MT

### MT103 — Single Customer Credit Transfer
- :20, :21, :23B, :32A, :33B, :50K, :52A, :53A, :54A, :56A, :57A, :59, :70, :71A, :71F, :71G, :72

### MT101 — Request for Transfer
- :20, :21R, :28D, :30, :23E, :32B, :57A, :59, :70, :71A, :71F, :71G, :72

### MT202 — General FI Transfer
- :20, :21, :32A, :52A, :53A, :56A, :57A, :58A, :72
