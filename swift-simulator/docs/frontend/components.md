# Componentes do Frontend - SWIFT

## Componentes de UI Reutilizáveis

### 1. Botões
- **PrimaryButton**: Botão principal para ações primárias (ex: "Enviar", "Confirmar")
- **SecondaryButton**: Botão secundário para ações secundárias (ex: "Cancelar", "Voltar")
- **DangerButton**: Botão para ações perigosas (ex: "Excluir", "Cancelar transferência")
- **IconButton**: Botão com ícone apenas para ações secundárias

### 2. Campos de Formulário
- **InputField**: Campo de texto genérico com label e helper text
- **PasswordField**: Campo de senha com toggle de visibilidade
- **SelectField**: Campo de seleção dropdown
- **IBANField**: Campo especializado para validação de IBAN
- **BICField**: Campo especializado para validação de BIC/SWIFT Code
- **CurrencyField**: Campo para valores monetários com formatação

### 3. Cards
- **AccountCard**: Exibe informações resumidas de uma conta bancária
- **TransactionCard**: Exibe informações resumidas de uma transação
- **DashboardCard**: Card genérico para o dashboard com título e conteúdo

### 4. Tabelas
- **DataTable**: Tabela genérica com paginação, ordenação e busca
- **TransactionTable**: Tabela específica para listagem de transações

### 5. Modal e Dialogs
- **ModalBase**: Componente base para modais
- **ConfirmationDialog**: Diálogo de confirmação para ações críticas
- **InfoModal**: Modal para exibição de informações

### 6. Navegação
- **Sidebar**: Menu lateral com links de navegação
- **Topbar**: Barra superior com logo, menu e perfil do usuário
- **Breadcrumb**: Componente de navegação hierárquica

### 7. Feedback e Loading
- **Spinner**: Indicador de carregamento
- **Alert**: Componente para mensagens de erro, sucesso, aviso
- **Toast**: Notificação flutuante temporária

### 8. Gráficos e Visualizações
- **LineChart**: Gráfico de linha para tendências
- **BarChart**: Gráfico de barras para comparações
- **PieChart**: Gráfico de pizza para proporções

## Componentes de Página

### 1. Authentication Components
- **LoginForm**: Formulário de login com campos de usuário e senha
- **RegisterForm**: Formulário de registro de novo usuário
- **ForgotPasswordForm**: Formulário para recuperação de senha
- **OTPVerification**: Componente para verificação OTP (usado no MFA)

### 2. Dashboard Components
- **BalanceSummary**: Resumo de saldos de contas
- **RecentTransactions**: Lista das transações recentes
- **QuickActions**: Botões de ações rápidas
- **ActivityFeed**: Feed de atividades recentes

### 3. Transfer Components
- **TransferForm**: Formulário completo para transferência SWIFT
- **TransferReview**: Componente para revisão e confirmação da transferência
- **TransferStatus**: Componente para acompanhamento do status da transferência
- **CurrencyConverter**: Conversor de moedas integrado

### 4. Account Components
- **AccountDetails**: Detalhes completos de uma conta
- **AccountList**: Lista de contas do usuário
- **AccountSettings**: Configurações da conta

### 5. Report Components
- **ReportFilters**: Filtros para relatórios
- **ReportTable**: Tabela de resultados de relatório
- **ReportCharts**: Conjunto de gráficos para relatórios

## Componentes Específicos de SWIFT

### 1. SWIFT Message Viewer
- **MessageDisplay**: Componente para exibir mensagens SWIFT formatadas
- **MT103Viewer**: Visualizador específico para mensagens MT103

### 2. Validation Components
- **IBANValidator**: Componente para validação e verificação de IBAN
- **BICValidator**: Componente para validação e verificação de BIC

### 3. Tracking Components
- **TransferTracker**: Componente para rastrear o progresso da transferência SWIFT
- **StatusTimeline**: Linha do tempo com os status da transferência

## Especificações de Estilo

### Cores
- **Primary**: #1976D2 (Azul institucional)
- **Secondary**: #455A64 (Cinza azulado)
- **Success**: #4CAF50 (Verde)
- **Warning**: #FF9800 (Laranja)
- **Error**: #F44336 (Vermelho)
- **Background**: #F5F5F5 (Cinza claro)
- **Surface**: #FFFFFF (Branco)

### Tipografia
- **Font Family**: Roboto, Arial, sans-serif
- **Heading 1**: 32px, bold
- **Heading 2**: 24px, bold
- **Heading 3**: 20px, bold
- **Body Large**: 16px, regular
- **Body Regular**: 14px, regular
- **Caption**: 12px, regular

### Espaçamento
- **Base Unit**: 8px
- **Small**: 4px
- **Medium**: 16px
- **Large**: 24px
- **Extra Large**: 32px

### Bordas
- **Border Radius**: 4px (default), 8px (cards)
- **Border Width**: 1px
- **Border Color**: #E0E0E0

## Responsividade

### Breakpoints
- **Mobile**: 0px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Mobile First
- Todos os componentes devem ser desenvolvidos com abordagem mobile-first
- Layout deve se adaptar automaticamente aos diferentes tamanhos de tela
- Touch targets devem ter tamanho mínimo de 44px para acessibilidade
