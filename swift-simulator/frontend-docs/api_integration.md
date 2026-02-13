# Integração com API - Frontend do Simulador SWIFT

## Visão Geral

Este documento descreve como o frontend do simulador SWIFT irá se comunicar com o backend através de requisições HTTP. Ele define endpoints, formatos de requisição e resposta, e padrões de tratamento de erros.

## Configuração Base

### URL Base da API
- Ambiente de desenvolvimento: `http://localhost:3001/api`
- Ambiente de produção: `{PRODUCTION_URL}/api`

### Headers Padrão
Todos os requests devem incluir os seguintes headers:

```
Content-Type: application/json
Accept: application/json
```

Para requisições autenticadas, adicionar:
```
Authorization: Bearer {token}
```

## Endpoints da API

### 1. Autenticação

#### POST /auth/login
Login de usuário

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha_segura"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com"
    },
    "token": "jwt_token_aqui"
  }
}
```

**Response Error (401):**
```json
{
  "status": "error",
  "message": "Credenciais inválidas"
}
```

#### POST /auth/register
Registro de novo usuário

**Request Body:**
```json
{
  "name": "Nome do Usuário",
  "email": "usuario@exemplo.com",
  "password": "senha_segura",
  "confirmPassword": "senha_segura"
}
```

**Response Success (201):**
```json
{
  "status": "success",
  "message": "Usuário registrado com sucesso",
  "data": {
    "user": {
      "id": 2,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com"
    }
  }
}
```

#### POST /auth/logout
Logout do usuário

**Response Success (200):**
```json
{
  "status": "success",
  "message": "Logout realizado com sucesso"
}
```

### 2. Usuários

#### GET /users/profile
Obter perfil do usuário autenticado

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### PUT /users/profile
Atualizar perfil do usuário

**Request Body:**
```json
{
  "name": "Novo Nome do Usuário",
  "email": "novoemail@exemplo.com"
}
```

### 3. Contas

#### GET /accounts
Listar contas do usuário

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "accounts": [
      {
        "id": 1,
        "accountNumber": "123456789",
        "iban": "BRXX000000001234567890123456789",
        "bic": "COBADEFFXXX",
        "balance": 5000.00,
        "currency": "USD",
        "dailyLimit": 10000.00
      }
    ]
  }
}
```

#### GET /accounts/{id}
Obter detalhes de uma conta específica

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "account": {
      "id": 1,
      "accountNumber": "123456789",
      "iban": "BRXX000000001234567890123456789",
      "bic": "COBADEFFXXX",
      "balance": 5000.00,
      "currency": "USD",
      "dailyLimit": 10000.00
    }
  }
}
```

### 4. Transferências SWIFT

#### GET /transfers
Listar transferências do usuário

**Query Parameters:**
- page (opcional, default: 1)
- limit (opcional, default: 10)
- status (opcional, ex: "completed", "pending")

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "transfers": [
      {
        "id": 1,
        "referenceNumber": "SW1234567890",
        "sourceAccountId": 1,
        "destinationAccount": {
          "iban": "DE44500105170445678901",
          "bic": "COBADEFFXXX",
          "holderName": "Beneficiário Exemplo"
        },
        "amount": 1500.00,
        "sourceCurrency": "USD",
        "targetCurrency": "EUR",
        "exchangeRate": 0.93,
        "fees": 25.00,
        "totalAmount": 1525.00,
        "status": "completed",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T01:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### POST /transfers
Criar nova transferência SWIFT

**Request Body:**
```json
{
  "sourceAccountId": 1,
  "destinationIban": "DE44500105170445678901",
  "destinationBic": "COBADEFFXXX",
  "destinationHolderName": "Beneficiário Exemplo",
  "amount": 1500.00,
  "currency": "USD",
  "purpose": "Pagamento de serviço"
}
```

**Response Success (201):**
```json
{
  "status": "success",
  "message": "Transferência criada com sucesso",
  "data": {
    "transfer": {
      "id": 1,
      "referenceNumber": "SW1234567890",
      "status": "pending",
      "estimatedCompletion": "2023-01-03T00:00:00.000Z"
    }
  }
}
```

**Response Validation Error (400):**
```json
{
  "status": "error",
  "message": "Erro de validação",
  "errors": [
    {
      "field": "destinationIban",
      "message": "IBAN inválido"
    }
  ]
}
```

#### GET /transfers/{id}
Obter detalhes de uma transferência específica

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "transfer": {
      "id": 1,
      "referenceNumber": "SW1234567890",
      "sourceAccountId": 1,
      "destinationAccount": {
        "iban": "DE44500105170445678901",
        "bic": "COBADEFFXXX",
        "holderName": "Beneficiário Exemplo"
      },
      "amount": 1500.00,
      "currency": "USD",
      "fees": 25.00,
      "totalAmount": 1525.00,
      "status": "processing",
      "swiftMessage": "MT103 message content...",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T01:00:00.000Z",
      "statusHistory": [
        {
          "status": "created",
          "timestamp": "2023-01-01T00:00:00.000Z",
          "description": "Transferência criada"
        },
        {
          "status": "processing",
          "timestamp": "2023-01-01T00:30:00.000Z",
          "description": "Processando na rede SWIFT"
        }
      ]
    }
  }
}
```

### 5. Validações

#### POST /validate/iban
Validar IBAN

**Request Body:**
```json
{
  "iban": "DE44500105170445678901"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "country": "DE",
    "bankCode": "50010517",
    "accountNumber": "445678901"
  }
}
```

#### POST /validate/bic
Validar BIC/SWIFT Code

**Request Body:**
```json
{
  "bic": "COBADEFFXXX"
}
```

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "bankName": "Commerzbank AG",
    "city": "Frankfurt am Main",
    "country": "Germany"
  }
}
```

### 6. Câmbio

#### GET /exchange/rates
Obter taxas de câmbio

**Query Parameters:**
- base (opcional, default: USD)
- symbols (opcional, ex: "EUR,GBP,JPY")

**Response Success (200):**
```json
{
  "status": "success",
  "data": {
    "base": "USD",
    "rates": {
      "EUR": 0.93,
      "GBP": 0.81,
      "JPY": 149.52
    },
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}
```

## Tratamento de Erros

### Códigos de Status HTTP

- **200 OK**: Requisição bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Erro de validação ou dados inválidos
- **401 Unauthorized**: Token ausente ou inválido
- **403 Forbidden**: Acesso não autorizado
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro interno do servidor

### Formato Padrão de Erro
```json
{
  "status": "error",
  "message": "Descrição do erro",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

Para erros de validação:
```json
{
  "status": "error",
  "message": "Erro de validação",
  "errors": [
    {
      "field": "nome_do_campo",
      "message": "mensagem de erro específica"
    }
  ]
}
```

## Padrões de Código

### Cliente HTTP
Utilizar Axios para todas as requisições HTTP:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Manipulação de Erros
Sempre tratar erros de forma apropriada:

```javascript
try {
  const response = await api.post('/auth/login', credentials);
  // lidar com sucesso
} catch (error) {
  if (error.response) {
    // Erro retornado pelo servidor
    console.error('Erro da API:', error.response.data.message);
    // Tratar mensagem específica para o usuário
  } else if (error.request) {
    // Erro de rede
    console.error('Erro de rede:', error.message);
  } else {
    // Outro tipo de erro
    console.error('Erro:', error.message);
  }
}
```

## Segurança

- Nunca expor tokens ou credenciais no código fonte
- Utilizar HTTPS em todos os ambientes
- Validar entradas do usuário tanto no frontend quanto no backend
- Implementar proteção contra CSRF quando aplicável
- Não armazenar informações sensíveis no localStorage sem criptografia