# Auditoria da Implementação SWIFT MT

## Checklist de Verificação

### 1. Sidebar — Pagamentos e Mensagens
- [x] `src/frontend/src/components/layout/Sidebar.tsx` — Seções Pagamentos e Mensagens
- [x] `src/frontend/src/constants/swiftMtTypes.ts` — 15 Pagamentos + 24 Mensagens
- [x] Navegação para `/messages/:mtCode` ao clicar em cada tipo

### 2. Backend
- [x] `src/backend/src/store/messagesStore.ts` — Store de mensagens
- [x] `src/backend/src/routes/messages.ts` — GET /, GET /stats, GET /:id, POST /
- [x] `src/backend/src/services/mtRegistry.ts` — Geradores para 39 tipos MT
- [x] `src/backend/src/services/mtUtils.ts` — Utilitários SWIFT
- [x] `src/backend/src/server.ts` — Rota `/api/messages` registrada

### 3. Frontend
- [x] `src/frontend/src/pages/MessageFormPage.tsx` — Formulário dinâmico
- [x] `src/frontend/src/pages/MessageViewPage.tsx` — Visualização da mensagem
- [x] `src/frontend/src/pages/MessagesListPage.tsx` — Lista de mensagens
- [x] `src/frontend/src/constants/mtFormSchemas.ts` — Schemas para 39 tipos
- [x] `src/frontend/src/services/messagesService.ts` — API de mensagens

### 4. Rotas App.tsx
- [x] `/messages` — Lista
- [x] `/messages/view/:id` — Detalhes (antes de :mtCode)
- [x] `/messages/:mtCode` — Formulário por tipo

### 5. Como Verificar

```bash
# Executar script de auditoria
cd swift-simulator && bash scripts/verify-implementation.sh

# Iniciar o projeto
npm run dev

# Frontend: http://localhost:5173 (ou porta indicada no terminal)
# Backend: http://localhost:3001/api
```

**Fluxo de teste:**
1. Acessar http://localhost:5173
2. Registrar em /register (criar conta)
3. Fazer login
4. Clicar em **"Mensagens SWIFT"** no menu lateral → deve mostrar lista vazia
5. Expandir **"Pagamentos"** → clicar em **MT103** → deve mostrar formulário
6. Selecionar conta em "Debitar de", preencher IBAN, BIC, nome, valor
7. Clicar **"Gerar mensagem"** → modal de confirmação
8. Confirmar → deve criar mensagem e redirecionar para visualização

### 6. Arquivos que Devem Existir

```
swift-simulator/
├── src/
│   ├── backend/
│   │   └── src/
│   │       ├── routes/messages.ts
│   │       ├── store/messagesStore.ts
│   │       ├── services/mtRegistry.ts
│   │       └── services/mtUtils.ts
│   └── frontend/
│       └── src/
│           ├── constants/
│           │   ├── swiftMtTypes.ts
│           │   └── mtFormSchemas.ts
│           ├── pages/
│           │   ├── MessageFormPage.tsx
│           │   ├── MessageViewPage.tsx
│           │   └── MessagesListPage.tsx
│           └── services/messagesService.ts
```
