# SWIFT Transfer — Índice Mestre

Documento central que liga toda a documentação do projeto. Use este índice para navegar entre especificações, implementação e design.

---

## Visão geral

| Documento | Propósito |
|-----------|-----------|
| [README.md](README.md) | Índice da documentação |
| [INDICE_MASTER.md](INDICE_MASTER.md) | **Este documento** — liga todos os docs |
| [SWIFT_DESIGN_PROFISSIONAL.md](SWIFT_DESIGN_PROFISSIONAL.md) | Design minimalista idêntico ao SWIFT real |

---

## Fluxo de implementação

```
1. Pesquisa e requisitos
   └── research.md, features.md
2. Plano e setup
   └── setup_plan.md
3. Especificações (Figma)
   └── FIGMA_SPEC_POR_PAGINA.md
   └── FIGMA_DESIGN_SYSTEM_DASHBOARD.md
   └── FIGMA_NOVA_TRANSFERENCIA.md
4. Design profissional SWIFT
   └── SWIFT_DESIGN_PROFISSIONAL.md
5. Aplicar no frontend
   └── FRONTEND_APLICAR_TUDO.md
6. Lacunas e melhorias
   └── GAPS_SOFTWARE_REAL.md
7. Integração técnica
   └── INTEGRACAO_ISO20022.md
```

---

## Documentos por categoria

### Pesquisa e requisitos
- [research.md](research.md) — Pesquisa sobre SWIFT, MT103, BIC, IBAN, protocolos
- [features.md](features.md) — Recursos, funcionalidades e tecnologias

### Plano
- [setup_plan.md](setup_plan.md) — Plano de implementação em fases

### Especificações Figma (estrutura e fluxo)
- [FIGMA_SPEC_POR_PAGINA.md](FIGMA_SPEC_POR_PAGINA.md) — Especificação por página (Login, Registro, Dashboard, Transferência, Histórico, etc.)
- [FIGMA_DESIGN_SYSTEM_DASHBOARD.md](FIGMA_DESIGN_SYSTEM_DASHBOARD.md) — Componentes: sidebar, topbar, botões, cards, tabelas, modais
- [FIGMA_NOVA_TRANSFERENCIA.md](FIGMA_NOVA_TRANSFERENCIA.md) — Fluxo da nova transferência SWIFT

### Design profissional SWIFT
- [SWIFT_DESIGN_PROFISSIONAL.md](SWIFT_DESIGN_PROFISSIONAL.md) — Paleta de cores, tipografia, componentes minimalistas (idêntico ao SWIFT real)

### Implementação frontend
- [FRONTEND_APLICAR_TUDO.md](FRONTEND_APLICAR_TUDO.md) — Guia completo: layout, páginas, popups, APIs, checklist

### Lacunas e melhorias
- [GAPS_SOFTWARE_REAL.md](GAPS_SOFTWARE_REAL.md) — O que falta para parecer software real (BIC, MT, animações, limite diário)

### Integração técnica
- [INTEGRACAO_ISO20022.md](INTEGRACAO_ISO20022.md) — ISO20022, pacs.008, formatos (CBPR, RTGS, FedNow, SIC, BAHTNET)

### Frontend (detalhes)
- [frontend/components.md](frontend/components.md) — Componentes reutilizáveis
- [frontend/state_management.md](frontend/state_management.md) — Gerenciamento de estado
- [frontend/responsive_design.md](frontend/responsive_design.md) — Breakpoints, grid
- [frontend/api_integration.md](frontend/api_integration.md) — Endpoints, autenticação

---

## Ordem recomendada para construir o dashboard

1. Ler [SWIFT_DESIGN_PROFISSIONAL.md](SWIFT_DESIGN_PROFISSIONAL.md) — paleta, tipografia, regras
2. Ler [FRONTEND_APLICAR_TUDO.md](FRONTEND_APLICAR_TUDO.md) — estrutura e APIs
3. Consultar [FIGMA_DESIGN_SYSTEM_DASHBOARD.md](FIGMA_DESIGN_SYSTEM_DASHBOARD.md) — componentes
4. Implementar conforme [GAPS_SOFTWARE_REAL.md](GAPS_SOFTWARE_REAL.md) — lacunas prioritárias

---

*Última atualização: índice mestre ligando todos os documentos do projeto.*
