# Network Report e Auto Fields — Documentação

## Visão Geral

Sistema aprimorado para geração automática de campos SWIFT e captura de Network Report (Message Trailer) recebido do gateway/Alliance/log.

## O que é Gerado pelo Nosso Sistema (Auto Fields)

- **Sender LT**: Logical Terminal (12 caracteres)
- **Application ID**: F01 (default)
- **Session Number**: 4 dígitos (0000-9999)
- **Sequence Number**: 6 dígitos (000000-999999)
- **UETR**: UUID v4 (RFC 4122)
- **MUR (108)**: Opcional
- **STP (119)**: Opcional (para MT103STP, MT102STP)

## O que é Recebido (Network Report)

- **CHK**: Checksum do trailer
- **Tracking**: Código de rastreamento
- **PKI Signature**: MAC-Equivalent
- **Access Code**: Código de acesso
- **Release Code**: Código de liberação
- **Category**: Ex.: NETWORK REPORT
- **Creation Time**: Data/hora do report
- **Application**: Ex.: SWIFT INTERFACE
- **Operator**: Ex.: SYSTEM
- **Raw text**: Texto completo imutável

## Persistência

### swift_auto_fields (data/swift_auto_fields.json)

- Um registro por mensagem MT (mt_type + mt_message_id)
- Unicidade: (sender_lt, session_number, sequence_number) e UETR

### swift_network_report (data/swift_network_report.json)

- Um registro por mensagem MT
- Apenas armazena; nunca gera valores

### swift_sequence_counter (data/swift_sequence_counter.json)

- Contador atômico por sender_lt
- Garante unicidade de session/sequence em concorrência

## API

### Criar mensagem (POST)

- MT103, MT Free, MT101, MT109: ao criar, `generateAutoFields` é chamado
- Response inclui `auto_fields`

### Obter mensagem (GET)

- Response inclui `auto_fields` e `network_report` quando existirem

### Anexar Network Report (POST)

```
POST /api/swift/mt103/messages/:id/network-report
POST /api/swift/free/messages/:id/network-report
POST /api/swift/mt101/messages/:id/network-report
POST /api/swift/mt109/messages/:id/network-report

Body: { "raw_text": "..." }
```

## Exemplo de Network Report

```
--------------------------------------------------Message Trailer----------------------------------------------
{CHK} : 41063056KDS
TRACKING : DH548IWBLD
PKI SIGNATURE : MAC-Equivalent
ACCESS CODE : GOSB78596124
RELEASE CODE : 598.D53225
--------------------------------------------------Interventions------------------------------------------------
Category : NETWORK REPORT
Creation Time : 16/12/2024 - 15:12:56
Application : SWIFT INTERFACE
Operator : SYSTEM
Text{1:F01DEUTDEDBSTG151256000}{3:{{119:STP}...
--------------------------------------------------End of Message ----------------------------------------------
```

## Migration

```bash
node scripts/migrations/001_swift_auto_fields_and_network_report.js
```

Cria os arquivos JSON iniciais em `src/backend/data/`.

## Testes

```bash
npm test
```

- `swiftAutoFields.test.ts`: geração de session/sequence, UETR, CHK, blocos
- `swiftNetworkReportParser.test.ts`: parse do report
- `swiftAutoNumberingService.test.ts`: unicidade em concorrência
- `swiftAutoNumberingService.test.ts`: persistência e idempotência

## Frontend

Em todas as páginas de detalhe (MT103, MT Free, MT101, MT109):

- **Auto Fields (Generated)**: Sender LT, Session, Sequence, UETR, MUR, STP
- **Network Report (Received)**: CHK, Tracking, PKI Signature, Access Code, Release Code, Category, Creation Time, Application, Operator, Raw text
- **Anexar Network Report**: Botão para colar e enviar o report do gateway
