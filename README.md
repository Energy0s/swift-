# SWIFT Transfer — Simulador Bancário SWIFT

Simulador de mensagens SWIFT MT para demonstração e treinamento em transferências internacionais.

## Visão geral

Sistema full-stack que simula operações bancárias SWIFT com suporte a **94 tipos de mensagens MT** (MT101–MT599): pagamentos, tesouraria/FX, trade/collections e securities.

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + Vite + MUI
- **Mensagens:** MT1xx, MT2xx, MT3xx, MT4xx, MT5xx

## Instalação

```bash
git clone https://github.com/Energy0s/swift-.git
cd swift-/swift-simulator
npm install
```

## Uso

```bash
# Desenvolvimento (frontend + backend)
npm run dev

# Build para produção
npm run build

# Limpar cache e rebuild
cd src/frontend && npm run rebuild
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

## Estrutura

```
swift-simulator/
├── src/
│   ├── backend/     # API REST, rotas, serviços MT
│   └── frontend/    # React, páginas, componentes
├── docs/            # Documentação completa
└── scripts/
```

## Funcionalidades

- Dashboard com contas e transações
- Transferências MT103
- Mensagens SWIFT (94 tipos MT)
- Sidebar com seções: Pagamentos, Mensagens, Tesouraria/FX, Trade/Collections, Securities
- Autenticação e registro de usuários
- Validação BIC/IBAN
- Histórico de transações

## Documentação

Ver [swift-simulator/docs/](swift-simulator/docs/) para documentação detalhada.

## Licença

MIT License.
