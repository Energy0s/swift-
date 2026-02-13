# Gerenciamento de Estado - Frontend SWIFT

## Visão Geral

Este documento descreve a estratégia de gerenciamento de estado para o frontend SWIFT, definindo como os dados serão mantidos, atualizados e compartilhados entre os componentes da aplicação.

## Tecnologia Escolhida

O gerenciamento de estado será feito utilizando **Redux Toolkit**, que é a abordagem recomendada para Redux moderno, oferecendo uma forma mais simples e eficiente de gerenciar estados complexos em aplicações React.

## Estrutura do Store

### 1. Auth Slice
Responsável pelo estado de autenticação do usuário:

```javascript
{
  isAuthenticated: boolean,
  user: {
    id: number,
    name: string,
    email: string,
    createdAt: string
  } | null,
  token: string | null,
  loading: boolean,
  error: string | null
}
```

**Ações:**
- `login`: Autenticar usuário
- `logout`: Desconectar usuário
- `register`: Registrar novo usuário
- `fetchProfile`: Buscar dados do perfil
- `updateProfile`: Atualizar dados do perfil

### 2. Accounts Slice
Responsável pelo estado das contas do usuário:

```javascript
{
  accounts: [
    {
      id: number,
      accountNumber: string,
      iban: string,
      bic: string,
      balance: number,
      currency: string,
      dailyLimit: number
    }
  ],
  selectedAccountId: number | null,
  loading: boolean,
  error: string | null
}
```

**Ações:**
- `fetchAccounts`: Buscar contas do usuário
- `selectAccount`: Selecionar uma conta específica
- `updateAccountBalance`: Atualizar saldo após transferência

### 3. Transfers Slice
Responsável pelo estado das transferências SWIFT:

```javascript
{
  transfers: [
    {
      id: number,
      referenceNumber: string,
      sourceAccountId: number,
      destinationAccount: {
        iban: string,
        bic: string,
        holderName: string
      },
      amount: number,
      sourceCurrency: string,
      targetCurrency: string,
      exchangeRate: number,
      fees: number,
      totalAmount: number,
      status: 'created' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled',
      purpose: string,
      createdAt: string,
      updatedAt: string,
      swiftMessage: string,
      statusHistory: [
        {
          status: string,
          timestamp: string,
          description: string
        }
      ]
    }
  ],
  currentTransfer: {
    // dados do formulário de transferência
    sourceAccountId: number | null,
    destinationIban: string,
    destinationBic: string,
    destinationHolderName: string,
    amount: number,
    currency: string,
    purpose: string
  },
  loading: boolean,
  error: string | null
}
```

**Ações:**
- `fetchTransfers`: Buscar histórico de transferências
- `createTransfer`: Criar nova transferência
- `getTransferById`: Obter detalhes de transferência específica
- `updateCurrentTransfer`: Atualizar dados do formulário
- `resetCurrentTransfer`: Limpar dados do formulário
- `updateTransferStatus`: Atualizar status de transferência

### 4. Validation Slice
Responsável pelo estado das validações:

```javascript
{
  ibanValidation: {
    iban: string,
    valid: boolean,
    country: string,
    bankCode: string,
    accountNumber: string,
    loading: boolean,
    error: string | null
  },
  bicValidation: {
    bic: string,
    valid: boolean,
    bankName: string,
    city: string,
    country: string,
    loading: boolean,
    error: string | null
  },
  loading: boolean,
  error: string | null
}
```

**Ações:**
- `validateIban`: Validar IBAN
- `validateBic`: Validar BIC/SWIFT Code

### 5. Exchange Slice
Responsável pelo estado das taxas de câmbio:

```javascript
{
  rates: {
    [currency: string]: number
  },
  base: string,
  timestamp: string,
  loading: boolean,
  error: string | null
}
```

**Ações:**
- `fetchExchangeRates`: Buscar taxas de câmbio
- `convertCurrency`: Converter valores entre moedas

## Middleware

### 1. Async Storage Middleware
Middleware personalizado para persistir parte do estado em localStorage:

- Manter o token de autenticação
- Manter preferências do usuário
- Manter dados temporários de formulários

### 2. Logger Middleware
Middleware para registrar todas as ações e mudanças de estado em ambiente de desenvolvimento para facilitar debug.

## Estratégia de Persistência

### Dados Sensíveis
- Tokens JWT: Armazenados em localStorage com criptografia leve
- Dados de autenticação: Não persistidos ou limpos automaticamente após período de inatividade

### Dados Não Sensíveis
- Preferências de interface
- Dados de formulários temporários
- Configurações do usuário

## Boas Práticas

### 1. Normalização de Dados
Estruturação de dados complexos em entidades normalizadas para evitar repetição e facilitar atualizações:

```javascript
// Em vez de:
{
  users: [
    { id: 1, name: 'John', posts: [{ id: 1, title: 'Post 1' }] }
  ]
}

// Usar:
{
  users: { 1: { id: 1, name: 'John', postIds: [1] } },
  posts: { 1: { id: 1, title: 'Post 1', userId: 1 } }
}
```

### 2. Separação de Concerns
Cada slice deve ter responsabilidades bem definidas e não deve manipular dados de outros slices diretamente.

### 3. Tipagem Forte (TypeScript)
Definição clara de tipos para estados, ações e payloads:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}
```

### 4. Imutabilidade
Sempre criar novos objetos ao invés de modificar os existentes:

```javascript
// Incorreto
state.user.name = 'New Name';

// Correto
return {
  ...state,
  user: {
    ...state.user,
    name: 'New Name'
  }
};
```

## Performance

### 1. Memoização
Uso de `createSelector` para memoizar cálculos complexos derivados do estado:

```javascript
const selectUserAccounts = createSelector(
  [selectAccounts, selectUserId],
  (accounts, userId) => accounts.filter(account => account.userId === userId)
);
```

### 2. Thunks Assíncronos
Uso de `createAsyncThunk` para operações assíncronas:

```javascript
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
```

## Segurança

### 1. Proteção de Dados
- Evitar armazenar informações sensíveis no estado global
- Limpeza automática de dados sensíveis após logout
- Criptografia de dados sensíveis armazenados localmente

### 2. Validação
- Validação de dados recebidos da API antes de atualizar o estado
- Verificação de tipos em tempo de execução em ambientes de desenvolvimento

## Testabilidade

### 1. Unidade
- Redutores devem ser funções puras e fáceis de testar isoladamente
- Ações assíncronas devem ser testadas com mocks adequados

### 2. Integração
- Testar fluxos completos de usuário envolvendo múltiplos slices
- Garantir que as atualizações de estado ocorrem corretamente em sequência
