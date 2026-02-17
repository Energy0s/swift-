# Geração Automática de Campos SWIFT

## Visão Geral

Módulo central para geração de campos automáticos em mensagens SWIFT (MT103, MT199, MT299, MT999, etc.), garantindo unicidade e conformidade com padrões FIN.

## Campos Gerados

### 1. Basic Header (Block 1)

- **Logical Terminal**: BIC configurado (`SWIFT_SENDER_BIC` ou `BOMGBRS1XXX`)
- **Session + Sequence**: 10 dígitos gerados via `crypto.randomBytes`, com cache de unicidade
- Formato: `{1:F01<LT>session<seq>}`

### 2. Application Header (Block 2)

- **MT Type**: I + número (ex.: I103, I199)
- **Receiver BIC**: 12 caracteres
- **Priority**: N (Normal), U (Urgent), S (System)

### 3. User Header (Block 3)

- **UETR**: UUID v4 (RFC 4122), maiúsculo, com cache de unicidade
- **108**: Sender Reference (prefixo REF + timestamp + hash curto)
- **111**: Service identifier (001 para GPI)

### 4. Trailer (Block 5)

- **CHK**: 12 caracteres hex, calculado via SHA-256 do conteúdo da mensagem
- **TNG**: Opcional quando aplicável

## Regras de Unicidade

- `generateSessionSequence()`: cache em memória evita reutilização
- `generateUetr()`: cache em memória evita reutilização
- `generateChk()`: determinístico para mesmo conteúdo
- Cache limitado a 100.000 entradas para evitar crescimento de memória

## Uso

```typescript
import {
  generateSessionSequence,
  generateUetr,
  generateChk,
  buildBlock1,
  buildBlock2,
  buildBlock3Gpi,
  buildBlock5,
} from './swiftAutoFields.js';

const block1 = buildBlock1({ senderBic: 'BOMGBRS1XXX' });
const block2 = buildBlock2({ mtCode: '103', receiverBic: 'UBSWCHZHXXX' });
const block3 = buildBlock3Gpi(uetr);
const block5 = buildBlock5(chk);
```

## Exemplo FIN MT199

```
{1:F01BOMGBRS1XXXX1234567890}{2:I199UBSWCHZHXXXXN}{3:{121:550E8400-E29B-41D4-A716-446655440000}}{4:
:20:DUE-DIL-2026-001
:21:NONREF
:79:
WE ARE SEEKING INFORMATION...
-}{5:{CHK:4A1B2C3D4E5F}{TNG:}}
```

## Persistência

Ao liberar mensagem (release), os campos automáticos são persistidos em `swiftHeader`:

- `sessionNumber`
- `sequenceNumber`
- `uetr`
- `chk`

## Verificação de Unicidade

- **Session/Sequence**: Cache em memória (`usedSessionSeq`) evita duplicação; em caso de colisão, gera novamente recursivamente.
- **UETR**: Cache em memória (`usedUetr`) evita duplicação; UUID v4 tem probabilidade de colisão desprezível.
- **CHK**: Determinístico para o conteúdo da mensagem; não há colisão entre mensagens diferentes.

## Testes

Execute `npm test` para validar:

- Formato de session/sequence (10 dígitos)
- Unicidade em 1000 gerações
- Formato UUID v4 do UETR
- Unicidade do UETR
- CHK determinístico e formato hex
- Blocos 1, 2, 3, 5
- Concorrência (500 gerações paralelas sem colisões)

## Variáveis de Ambiente

- `SWIFT_SENDER_BIC`: BIC do remetente (default: BOMGBRS1XXX)
