# Lacunas — Para Parecer Software Real

O que falta para o simulador deixar de parecer fraude e se aproximar de um sistema bancário real.

---

## 1. Tipos de mensagem SWIFT (MT)

### O que temos hoje
- MT103 (transferência cliente)
- MT202 (transferência entre bancos)
- MT940 (extrato de conta — GET /api/accounts/:id/statement?format=mt940)
- pacs.008 em vários formatos (CBPR, RTGS, FedNow, SIC/euroSIC, BAHTNET)
- Tradução MT103 ↔ pacs.008

### O que falta (MT comum em bancos)

| Tipo | Uso | Prioridade |
|------|-----|------------|
| MT101 | Ordem de transferência múltipla | Média |
| MT102 | Transferência múltipla de cliente | Média |
| MT103+ | MT103 com campos adicionais | Baixa |
| MT202 | Transferência entre bancos | Alta |
| MT202COV | MT202 com cobertura | Média |
| MT205 | Transferência doméstica entre bancos | Baixa |
| MT940 | Extrato de conta | Alta |
| MT950 | Extrato para cliente | Média |
| MT199 | Confirmação universal | Média |
| MT299 | Mensagem livre entre bancos | Baixa |

### Ação
- Adicionar geração de MT202, MT940
- Exibir no histórico qual tipo foi usado
- Permitir escolher tipo de mensagem na transferência (quando fizer sentido)

---

## 2. Banco de dados de BICs

### O que temos hoje
- **Base de BICs** — 70+ bancos em `data/banks.json`
- **Busca** — `GET /api/banks/search?q=COBA` (por BIC, nome, cidade, país)
- **Lookup** — `GET /api/banks/lookup?bic=COBADEFF`
- **Validação** — `POST /api/validate/bic` retorna nome, cidade, país quando encontrado

### O que falta (opcional)

- **Mais bancos** — expandir a base (centenas/milhares)

### Fontes de dados
- SWIFT BIC Directory (pago)
- APIs públicas (ex: OpenBanking, alguns gratuitos)
- Arquivo estático com BICs mais usados (top 500–1000 bancos)

### Ação
- Criar tabela `banks` (bic, name, city, country)
- Endpoint `GET /api/banks/search?q=COBADEFF` ou `?q=Commerzbank`
- Autocomplete no campo BIC
- Exibir nome do banco ao validar

---

## 3. Banco de dados de IBANs (opcional)

- Validação de formato já existe
- Alguns sistemas checam se o IBAN existe (via API externa)
- Para simulador: pode ficar só em formato
- Para mais realismo: integração com serviço de validação (pago)

---

## 4. Animações e loading

### O que temos hoje
- Resposta direta da API
- Sem transições visuais

### O que falta

| Elemento | Comportamento real |
|----------|--------------------|
| **Barra de progresso** | Ao confirmar transferência: 0% → 20% (validando) → 50% (gerando mensagem) → 80% (enviando) → 100% (concluído) |
| **Skeleton loading** | Cards e tabelas com placeholders animados enquanto carrega |
| **Spinner contextual** | Botão com spinner dentro, desabilitado durante ação |
| **Transições de página** | Fade ou slide ao mudar de tela |
| **Feedback de clique** | Botões com estado "pressed" |
| **Toast com animação** | Entrada suave (slide/fade) e saída |
| **Timeline animada** | Status da transferência com animação ao carregar |

### Ação
- Barra de progresso no fluxo de transferência (simulada em etapas)
- Skeleton nos cards do dashboard e na tabela do histórico
- Spinner nos botões durante submit
- Transições CSS ou lib de animação (Framer Motion, etc.)

---

## 5. Comportamento de software real

### O que falta

| Comportamento | Descrição |
|---------------|-----------|
| **Confirmação em etapas** | Não enviar direto; sempre modal "Tem certeza?" antes de ações críticas |
| **Desfazer / cancelar** | Opção de cancelar transferência pendente (com prazo) |
| **Número de referência visível** | Exibir ref SWIFT em toda a jornada (formulário, confirmação, sucesso, detalhes) |
| **Data/hora em tudo** | Timestamp em cada ação (criado em, processado em, etc.) |
| **Auditoria** | Log de ações (quem fez o quê, quando) — mesmo que em memória |
| **Limite diário** | Validar contra limite da conta antes de enviar |
| **Mensagens de erro claras** | Códigos e textos que um operador reconheceria (ex: "AC01 - Conta incorreta") |
| **Retry em falha** | Botão "Tentar novamente" quando a API falha |
| **Offline / timeout** | Mensagem clara se a rede falhar |
| **Sessão** | Logout automático após inatividade (opcional) |

### Ação
- Revisar fluxos de confirmação
- Adicionar limite diário na validação
- Padronizar mensagens de erro (códigos ISO)
- Implementar retry em chamadas de API
- Exibir data/hora em todas as telas relevantes

---

## 6. Detalhes da transferência (tela)

### O que falta para parecer real

- **Timeline de status** — Criado → Validado → Mensagem gerada → Enviado → Processando → Concluído (com datas)
- **Mensagem SWIFT completa** — Exibir MT103 ou XML real, com syntax highlight
- **Seletor de formato** — Escolher ver como MT103, pacs.008, CBPR, etc.
- **Botão copiar** — Copiar mensagem ou referência
- **Comprovante** — Área "Imprimir comprovante" ou "Download PDF"
- **Ações** — Cancelar (se pendente), Reportar problema

---

## 7. Resumo de prioridades

| Prioridade | Item | Esforço |
|------------|------|---------|
| Alta | Barra de progresso na transferência | Baixo |
| Alta | Skeleton loading | Baixo |
| Alta | Banco de dados BIC + autocomplete | Médio |
| Alta | Timeline animada na tela de detalhes | Baixo |
| Média | MT202, MT940 | Médio |
| Média | Validação de limite diário | Baixo |
| Média | Mensagens de erro com códigos | Baixo |
| Baixa | Base de BICs completa | Alto |
| Baixa | Mais tipos MT | Alto |

---

## 8. Checklist rápido

- [ ] Barra de progresso ao confirmar transferência
- [ ] Skeleton nos cards e tabelas
- [ ] Spinner nos botões durante submit
- [ ] Tabela `banks` com BIC + nome
- [ ] Autocomplete no campo BIC
- [ ] Exibir nome do banco ao validar BIC
- [ ] Timeline de status na tela de detalhes
- [ ] Seletor de formato da mensagem (MT103, XML, etc.)
- [ ] Validação de limite diário
- [ ] Modal de confirmação em ações críticas
- [ ] Mensagens de erro com códigos (AC01, etc.)
- [ ] Retry quando API falha
- [ ] Data/hora em todas as operações

---

*Documento de lacunas. Implementar conforme prioridade e esforço.*
