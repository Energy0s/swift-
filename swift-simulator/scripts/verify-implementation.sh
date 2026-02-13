#!/bin/bash
# Script de verificação da implementação SWIFT MT
# Execute: cd swift-simulator && bash scripts/verify-implementation.sh

set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "=== Auditoria da Implementação SWIFT MT ==="
echo ""

# 1. Arquivos obrigatórios
echo "1. Verificando arquivos..."
FILES=(
  "src/backend/src/routes/messages.ts"
  "src/backend/src/store/messagesStore.ts"
  "src/backend/src/services/mtRegistry.ts"
  "src/backend/src/services/mtUtils.ts"
  "src/frontend/src/constants/swiftMtTypes.ts"
  "src/frontend/src/constants/mtFormSchemas.ts"
  "src/frontend/src/pages/MessageFormPage.tsx"
  "src/frontend/src/pages/MessageViewPage.tsx"
  "src/frontend/src/pages/MessagesListPage.tsx"
  "src/frontend/src/services/messagesService.ts"
)

MISSING=0
for f in "${FILES[@]}"; do
  if [ -f "$ROOT/$f" ]; then
    echo "   OK $f"
  else
    echo "   FALTA $f"
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo ""
  echo "ERRO: Alguns arquivos estão faltando."
  exit 1
fi

echo ""
echo "2. Verificando imports no server.ts..."
grep -q "messagesRoutes" "$ROOT/src/backend/src/server.ts" && echo "   OK messagesRoutes importado" || { echo "   FALTA messagesRoutes"; exit 1; }
grep -q "'/api/messages'" "$ROOT/src/backend/src/server.ts" && echo "   OK rota /api/messages registrada" || { echo "   FALTA rota"; exit 1; }

echo ""
echo "3. Verificando rotas no App.tsx..."
grep -q "MessageFormPage" "$ROOT/src/frontend/src/App.tsx" && echo "   OK MessageFormPage" || { echo "   FALTA"; exit 1; }
grep -q "MessageViewPage" "$ROOT/src/frontend/src/App.tsx" && echo "   OK MessageViewPage" || { echo "   FALTA"; exit 1; }
grep -q "MessagesListPage" "$ROOT/src/frontend/src/App.tsx" && echo "   OK MessagesListPage" || { echo "   FALTA"; exit 1; }
grep -q 'path="/messages' "$ROOT/src/frontend/src/App.tsx" && echo "   OK rotas /messages" || { echo "   FALTA"; exit 1; }

echo ""
echo "4. Verificando Sidebar..."
grep -q "PAGAMENTOS" "$ROOT/src/frontend/src/components/layout/Sidebar.tsx" && echo "   OK PAGAMENTOS no Sidebar" || { echo "   FALTA"; exit 1; }
grep -q "MENSAGENS" "$ROOT/src/frontend/src/components/layout/Sidebar.tsx" && echo "   OK MENSAGENS no Sidebar" || { echo "   FALTA"; exit 1; }

echo ""
echo "=== Todos os checks passaram ==="
echo ""
echo "Para testar: npm run dev"
echo "Depois: http://localhost:5173 -> Login -> Mensagens SWIFT -> Pagamentos -> MT103"
