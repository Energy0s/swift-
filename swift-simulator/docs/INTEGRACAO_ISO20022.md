# Como Aplicar ISO20022 no Sistema SWIFT

Este documento explica como integrar o padrão ISO20022 (e conceitos do demo Payment-Components) no seu sistema Node.js.

---

## Visão Geral da Integração

```
┌─────────────┐     POST /transfers      ┌─────────────────┐     Gera XML      ┌──────────────────┐
│   Frontend  │ ──────────────────────► │  Backend Node   │ ────────────────► │  Mensagem        │
│   (Figma)   │     { IBAN, valor... }   │  (Express)      │   pacs.008        │  ISO20022        │
└─────────────┘                          └─────────────────┘                   └──────────────────┘
                                                  │
                                                  │ Armazena
                                                  ▼
                                         ┌─────────────────┐
                                         │  PostgreSQL     │
                                         │  (transferências│
                                         │   + swift_msg)  │
                                         └─────────────────┘
```

---

## Opções de Implementação

### Opção A: Node.js puro (recomendada para começar)

**Prós:** Sem dependências externas, stack única  
**Contras:** Você implementa a geração/validação do XML

#### 1. Estrutura da mensagem pacs.008

O pacs.008 (equivalente ao MT103) tem esta estrutura simplificada:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>UNIQUE-REF-12345</MsgId>
      <CreDtTm>2025-02-13T10:30:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>INSTR-001</InstrId>
        <EndToEndId>E2E-REF-12345</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="EUR">1500.00</IntrBkSttlmAmt>
      <InstgAgt><FinInstnId><BIC>BANCOORIGEM</BIC></FinInstnId></InstgAgt>
      <Dbtr><Nm>Nome do Ordenante</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>DE89370400440532013000</IBAN></Id></DbtrAcct>
      <Cdtr><Nm>Nome do Beneficiário</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>FR7630006000011234567890189</IBAN></Id></CdtrAcct>
      <CdtrAgt><FinInstnId><BIC>BANCODESTINO</BIC></FinInstnId></CdtrAgt>
      <RmtInf><Ustrd>Propósito da transferência</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
```

#### 2. Serviço de geração no backend

Crie `src/backend/src/services/iso20022Service.ts`:

```typescript
// Gera mensagem pacs.008 (Customer Credit Transfer)
export function generatePacs008(transfer: {
  referenceNumber: string;
  sourceIban: string;
  sourceBic: string;
  sourceHolderName: string;
  destinationIban: string;
  destinationBic: string;
  destinationHolderName: string;
  amount: number;
  currency: string;
  purpose?: string;
}): string {
  const now = new Date().toISOString().slice(0, 19);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${transfer.referenceNumber}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>${transfer.referenceNumber}</InstrId>
        <EndToEndId>${transfer.referenceNumber}</EndToEndId>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${transfer.currency}">${transfer.amount.toFixed(2)}</IntrBkSttlmAmt>
      <InstgAgt><FinInstnId><BIC>${transfer.sourceBic}</BIC></FinInstnId></InstgAgt>
      <Dbtr><Nm>${escapeXml(transfer.sourceHolderName)}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${transfer.sourceIban}</IBAN></Id></DbtrAcct>
      <Cdtr><Nm>${escapeXml(transfer.destinationHolderName)}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${transfer.destinationIban}</IBAN></Id></CdtrAcct>
      <CdtrAgt><FinInstnId><BIC>${transfer.destinationBic}</BIC></FinInstnId></CdtrAgt>
      <RmtInf><Ustrd>${escapeXml(transfer.purpose || '')}</Ustrd></RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

#### 3. Uso na rota de transferência

```typescript
// POST /api/transfers
import { generatePacs008 } from './services/iso20022Service';

// Após validar e salvar a transferência no banco:
const swiftMessage = generatePacs008({
  referenceNumber: transfer.referenceNumber,
  sourceIban: sourceAccount.iban,
  sourceBic: sourceAccount.bic,
  sourceHolderName: user.name,
  destinationIban: req.body.destinationIban,
  destinationBic: req.body.destinationBic,
  destinationHolderName: req.body.destinationHolderName,
  amount: req.body.amount,
  currency: req.body.currency,
  purpose: req.body.purpose,
});

// Salvar no banco junto com a transferência
await Transfer.update(transfer.id, { swiftMessage });
```

---

### Opção B: Microserviço Java (SDK Payment Components)

**Prós:** Validação completa, suporte oficial  
**Contras:** Duas stacks, mais complexidade

#### Arquitetura

```
Backend Node.js  ──HTTP──►  Serviço Java (porta 8081)
     │                            │
     │  POST /generate-pacs008    │  Usa SDK Payment Components
     │  { transfer data }         │  Retorna XML validado
     │  ◄── 200 { xml }           │
```

#### Endpoint no Node.js

```typescript
// Chama o microserviço Java
const response = await axios.post('http://localhost:8081/generate-pacs008', {
  referenceNumber, sourceIban, destinationIban, amount, currency, ...
});
const swiftMessage = response.data.xml;
```

---

### Opção C: Manter MT103 + adicionar pacs.008 depois

Se quiser começar mais simples:

1. **Fase 1:** Gere MT103 (formato texto legado) — mais fácil de implementar
2. **Fase 2:** Adicione geração de pacs.008 em paralelo
3. **Fase 3:** Migre totalmente para ISO20022

---

## Onde Aplicar no Seu Sistema

### 1. Banco de dados

Adicione coluna para armazenar a mensagem:

```sql
ALTER TABLE transfers ADD COLUMN swift_message_xml TEXT;
ALTER TABLE transfers ADD COLUMN message_type VARCHAR(20) DEFAULT 'pacs.008';
```

### 2. Fluxo da transferência (atualizado)

```
1. Usuário preenche formulário (Figma → seu frontend)
2. Frontend → POST /api/transfers
3. Backend valida IBAN/BIC
4. Backend gera pacs.008 (ou MT103)
5. Backend salva transferência + XML no banco
6. Backend retorna { id, referenceNumber, status, swiftMessage }
7. Frontend exibe confirmação e opção "Ver mensagem SWIFT"
```

### 3. Endpoint para visualizar mensagem

```http
GET /api/transfers/:id/swift-message
GET /api/transfers/:id/swift-message?format=xml         # pacs.008 (padrão)
GET /api/transfers/:id/swift-message?format=mt103       # MT103
GET /api/transfers/:id/swift-message?format=mt202       # MT202 (interbancário)
GET /api/transfers/:id/swift-message?format=sepa-epc-ct # SEPA-EPC Credit Transfer
GET /api/transfers/:id/swift-message?format=cbpr        # CBPR+ (AppHdr + pacs.008)
GET /api/transfers/:id/swift-message?format=rtgs        # TARGET2 RTGS (pacs.008)
GET /api/transfers/:id/swift-message?format=fednow      # FedNow (pacs.008)
GET /api/transfers/:id/swift-message?format=sic-eurosic # SIC/euroSIC (Suíça, pacs.008)
GET /api/transfers/:id/swift-message?format=bahtnet    # BAHTNET (Tailândia, AppHdr + pacs.008)
```

Retorna o XML (pacs.008, SEPA-EPC-CT) ou o texto MT103/MT202 para exibir na página de detalhes.

### Extrato de conta (MT940)

```http
GET /api/accounts/:id/statement?format=mt940
```

Retorna extrato MT940 da conta.

### Busca de bancos (BIC)

```http
GET /api/banks/search?q=COBA
GET /api/banks/lookup?bic=COBADEFF
```

Para autocomplete no campo BIC. A validação `POST /api/validate/bic` retorna nome do banco quando encontrado na base.

### 4. Tradução MT ↔ MX (CBPR+)

Conforme [demo-translator-cbpr](https://github.com/Payment-Components/demo-translator-cbpr):

```http
POST /api/translate/mt-to-mx
Content-Type: application/json

{ "message": "{1:F01...}{2:I103...}{4:...}", "format": "pacs008" }
# format: "pacs008" (padrão) ou "cbpr"

POST /api/translate/mx-to-mt
Content-Type: application/json

{ "message": "<Document>...</Document>" }
# Aceita pacs.008 ou envelope CBPR+
```

Com `Accept: application/json` retorna `{ message, format, errors }`.

### 5. Respostas (pacs.002, pacs.004)

Quando receber confirmação ou devolução de um banco parceiro:

- **pacs.002** → atualizar status da transferência (ACCP, RJCT, etc.)
- **pacs.004** → registrar devolução

Crie um endpoint:

```http
POST /api/transfers/incoming-message
Content-Type: application/xml

<body com XML pacs.002 ou pacs.004>
```

O backend parseia o XML, identifica o tipo e atualiza a transferência correspondente.

---

## Mapeamento: Seu formulário → pacs.008

| Campo do formulário (FIGMA_SPEC) | Campo pacs.008 |
|----------------------------------|----------------|
| Conta de origem (IBAN)           | DbtrAcct/Id/IBAN |
| Conta de origem (BIC)             | InstgAgt/FinInstnId/BIC |
| IBAN destinatário                 | CdtrAcct/Id/IBAN |
| BIC destinatário                  | CdtrAgt/FinInstnId/BIC |
| Nome beneficiário                 | Cdtr/Nm |
| Valor                             | IntrBkSttlmAmt |
| Moeda                             | IntrBkSttlmAmt @Ccy |
| Propósito                         | RmtInf/Ustrd |
| Nº referência                     | MsgId, InstrId, EndToEndId |

---

## Próximos Passos

1. **Implementar** o `iso20022Service.ts` (Opção A)
2. **Integrar** na rota `POST /transfers`
3. **Adicionar** coluna `swift_message_xml` na tabela de transferências
4. **Expor** `GET /transfers/:id/swift-message` para o frontend
5. **Opcional:** Validar XML contra XSD (usar lib `libxmljs2` ou similar)

Quando o backend estiver implementado, posso ajudar a conectar cada parte.
