# Design Profissional SWIFT — Minimalista

Especificação de design baseada no **SWIFT real** (Alliance Lite, GPI, corporate banking). Interface extremamente profissional, minimalista, sem cores vibrantes. Idêntica ao ambiente corporativo bancário.

---

## Referência: SWIFT oficial

- **SWIFT Corporate Banking** — interface para tesouraria corporativa
- **Alliance Lite2 / Alliance Cloud** — mensageria SWIFT
- **SWIFT GPI Tracker** — rastreamento de pagamentos
- **Enterprise Europe SWIFT Themes** — temas oficiais

---

## Paleta de cores (SWIFT real)

### Cores principais
| Uso | Cor | Hex | Uso |
|-----|-----|-----|-----|
| Ação primária | Azul SWIFT | `#006BA6` | Botões, links, ícones ativos |
| Hover primário | Azul escuro | `#00587C` | Hover em botões |
| Fundo principal | Cinza claro | `#F7F7F7` | Background da aplicação |
| Fundo cards/paper | Branco | `#FFFFFF` | Cards, inputs, modais |
| Texto primário | Cinza escuro | `#333333` | Títulos, corpo |
| Texto secundário | Cinza médio | `#6B6B6B` | Labels, helper text |
| Borda | Cinza claro | `#E0E0E0` | Divisores, bordas |

### Cores de status (sutis, não vibrantes)
| Status | Cor | Hex |
|--------|-----|-----|
| Sucesso | Verde escuro | `#2E7D32` |
| Erro | Vermelho escuro | `#C62828` |
| Aviso | Âmbar escuro | `#EF6C00` |
| Info | Azul escuro | `#1565C0` |

### Proibido
- Cores vibrantes (laranja forte, verde neon, roxo)
- Gradientes chamativos
- Sombras pesadas
- Ícones coloridos (exceto status)

---

## Tipografia

- **Fonte principal**: `'Inter'`, `'Segoe UI'`, `'Roboto'`, `sans-serif`
- **Monospace** (IBAN, BIC, referências): `'Roboto Mono'`, `'Consolas'`, `monospace`

### Tamanhos
| Elemento | Tamanho | Peso |
|----------|---------|------|
| H1 (título página) | 1.5rem | 600 |
| H2 (seção) | 1.25rem | 600 |
| H3 (subseção) | 1rem | 600 |
| Body | 0.875rem | 400 |
| Caption | 0.75rem | 400 |
| Botão | 0.875rem | 500 |

---

## Componentes

### Sidebar
- Fundo: `#FFFFFF`
- Borda direita: `1px solid #E0E0E0`
- Item ativo: fundo `#F0F4F8`, texto `#006BA6`
- Item hover: fundo `#F7F7F7`
- Sem ícones coloridos — ícones em `#6B6B6B`, ativo em `#006BA6`

### Topbar
- Fundo: `#FFFFFF`
- Borda inferior: `1px solid #E0E0E0`
- Breadcrumb: `#6B6B6B`
- Sem gradientes

### Botões
- **Primary**: fundo `#006BA6`, texto branco, hover `#00587C`
- **Secondary**: borda `#E0E0E0`, texto `#333333`, hover fundo `#F7F7F7`
- **Ghost**: texto `#006BA6`, hover fundo `#F0F4F8`
- Sem sombras, bordas sutis

### Cards
- Fundo: `#FFFFFF`
- Borda: `1px solid #E0E0E0`
- Border-radius: `4px` (mínimo)
- Sem sombras ou sombra muito sutil (`0 1px 2px rgba(0,0,0,0.04)`)

### Tabelas
- Header: fundo `#F7F7F7`, texto `#6B6B6B`, peso 500
- Linha hover: fundo `#FAFAFA`
- Borda: `1px solid #E0E0E0`

### Inputs
- Borda: `#E0E0E0`
- Focus: borda `#006BA6`, outline sutil
- Erro: borda `#C62828`

### Modais
- Fundo overlay: `rgba(0,0,0,0.4)`
- Conteúdo: `#FFFFFF`, borda `#E0E0E0`

---

## Espaçamento

- Base: `8px`
- Padding cards: `24px`
- Padding página: `24px`
- Gap entre elementos: `8px`, `16px`, `24px`

---

## Regras de design

1. **Minimalista** — apenas o necessário, sem decoração
2. **Monocromático** — cinzas + azul de ação
3. **Alto contraste** — texto legível (#333 em #FFF)
4. **Bordas sutis** — `#E0E0E0`, 1px
5. **Sem sombras pesadas** — no máximo `0 1px 2px rgba(0,0,0,0.04)`
6. **Ícones discretos** — tamanho 20–24px, cor `#6B6B6B`
7. **Dados em destaque** — IBAN, BIC, referência em monospace

---

## Fonte Inter

Carregada via `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
```

## Checklist de aplicação

- [x] Tema MUI com paleta SWIFT
- [x] Sidebar com cores corretas
- [x] Topbar minimalista
- [x] Botões sem sombra
- [x] Cards com borda sutil
- [x] Tabelas com header cinza claro
- [x] Inputs com borda #E0E0E0
- [x] Remover cores vibrantes
- [x] Fonte Inter

---

*Design baseado em SWIFT Corporate Banking, Alliance Lite e Enterprise Europe SWIFT Themes.*
