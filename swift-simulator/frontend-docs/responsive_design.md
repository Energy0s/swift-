# Design Responsivo - Frontend do Simulador SWIFT

## Visão Geral

Este documento estabelece as diretrizes e especificações para o design responsivo do frontend do simulador SWIFT, garantindo uma experiência de usuário consistente e otimizada em diferentes dispositivos e tamanhos de tela.

## Breakpoints

### Dispositivos Móveis
- **Extra Small (XS)**: 0px - 575px
  - Smartphone básico
  - Modo retrato e paisagem

- **Small (SM)**: 576px - 767px
  - Smartphone moderno
  - Modo retrato

### Dispositivos Tablet
- **Medium (MD)**: 768px - 1023px
  - Tablet modo paisagem
  - Smartphone modo paisagem grande

### Dispositivos Desktop
- **Large (LG)**: 1024px - 1279px
  - Desktop pequeno
  - Laptop padrão
  - Tablet modo retrato

- **Extra Large (XL)**: 1280px - 1439px
  - Desktop padrão
  - Laptop de tela grande

- **Extra Extra Large (XXL)**: 1440px+
  - Desktop grande
  - Monitores widescreen

## Estratégia Mobile-First

Adotaremos uma abordagem mobile-first, onde o design é construído primeiro para dispositivos móveis e depois adaptado para telas maiores usando media queries.

### Vantagens:
- Melhor desempenho em dispositivos móveis
- Código mais limpo e eficiente
- Experiência de usuário otimizada para o crescimento no tráfego móvel

## Grid System

### Framework CSS
Utilizaremos o sistema de grid do Material UI, que é baseado em um layout de 12 colunas flexível.

### Classes de Grid
- `xs` - Extra small devices (portrait phones, less than 576px)
- `sm` - Small devices (landscape phones, 576px and up)
- `md` - Medium devices (tablets, 768px and up)
- `lg` - Large devices (desktops, 992px and up)
- `xl` - Extra large devices (large desktops, 1200px and up)

### Exemplo de Implementação
```jsx
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4} lg={3}>
    {/* Conteúdo */}
  </Grid>
</Grid>
```

## Componentes Responsivos

### 1. Navegação

#### Mobile (XS-SM)
- **Hamburger Menu**: Ícone de menu que expande para mostrar opções de navegação
- **Bottom Navigation**: Barra de navegação inferior com ícones para principais seções
- **Drawer**: Menu lateral deslizante com todas as opções de navegação

#### Tablet/Deskt (MD-XL)
- **Sidebar**: Menu lateral fixo com seções e subseções
- **Topbar**: Barra superior com logo, menu de usuário e notificações
- **Breadcrumbs**: Navegação hierárquica para localização do usuário

### 2. Formulários

#### Mobile
- Campos de entrada ocupam 100% da largura
- Labels acima dos campos
- Botões de ação com tamanho adequado para toque (mínimo 44px)
- Layout vertical de elementos

#### Tablet/Deskt
- Possibilidade de layout horizontal para campos relacionados
- Labels podem estar ao lado dos campos
- Mais campos visíveis simultaneamente
- Botões de ação podem ter variação de tamanho e posição

### 3. Tabelas

#### Mobile
- Tabelas transformadas em cards
- Rolagem horizontal para tabelas com muitas colunas
- Colunas prioritárias visíveis (resto oculto ou em expansão)
- Botão "Expandir" para ver detalhes completos

#### Tablet/Deskt
- Tabelas tradicionais com todas as colunas visíveis
- Ordenação por coluna
- Paginação adequada
- Filtragem avançada

### 4. Cards

#### Mobile
- Cards ocupam 100% da largura disponível
- Espaçamento reduzido
- Elementos organizados verticalmente

#### Tablet/Deskt
- Multiplos cards por linha (2-4 dependendo do breakpoint)
- Espaçamento maior entre cards
- Layout mais complexo dentro dos cards

## Tipografia Responsiva

### Escala de Tamanhos
A tipografia deve se adaptar ao tamanho da tela mantendo a hierarquia visual:

- **XXL Screens**: H1: 3.5rem, H2: 2.5rem, H3: 2rem
- **XL Screens**: H1: 3rem, H2: 2.25rem, H3: 1.75rem
- **LG Screens**: H1: 2.5rem, H2: 2rem, H3: 1.5rem
- **MD Screens**: H1: 2.25rem, H2: 1.75rem, H3: 1.375rem
- **SM Screens**: H1: 2rem, H2: 1.5rem, H3: 1.25rem
- **XS Screens**: H1: 1.75rem, H2: 1.375rem, H3: 1.125rem

### Implementação
```css
/* Exemplo de tipografia responsiva */
.responsive-h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
}
```

## Espaçamento Responsivo

### Margens e Padding
Os espaçamentos devem variar conforme o tamanho da tela:

- **XS Screens**: Base unit = 4px
- **SM Screens**: Base unit = 6px
- **MD Screens**: Base unit = 8px
- **LG+ Screens**: Base unit = 8px (ou mais para áreas específicas)

### Implementação
```jsx
<Box padding={{ xs: 1, sm: 2, md: 3 }}>
  {/* Conteúdo com padding responsivo */}
</Box>
```

## Imagens e Mídias

### Imagens
- Sempre usar `max-width: 100%` e `height: auto`
- Utilizar `srcset` para imagens com diferentes densidades
- Considerar WebP para melhor compressão
- Lazy loading para imagens fora da viewport inicial

### Ícones
- Utilizar SVG sempre que possível
- Ícones devem ter tamanho adequado para cada dispositivo
- Considerar touch targets (mínimo 44px) em dispositivos móveis

## Performance

### Otimizações
- Carregar somente o CSS necessário para cada breakpoint
- Utilizar técnicas de lazy loading para componentes pesados
- Minificar e comprimir assets
- Implementar caching estratégico

### Considerações Mobile
- Menos animações complexas
- Reduzir o número de requisições HTTP
- Otimizar imagens e mídias
- Evitar layouts complexos que possam causar reflows excessivos

## Acessibilidade

### Touch Targets
- Mínimo 44px x 44px para elementos interativos em dispositivos móveis
- Espaçamento adequado entre elementos interativos
- Feedback visual claro para estados de interação

### Navegação por Teclado
- Manter ordem lógica de tabulação em todos os breakpoints
- Foco visível em elementos interativos
- Navegação sem perda de funcionalidade em qualquer tamanho de tela

## Testes de Responsividade

### Checklist de Testes
- [ ] Funcionalidades básicas operam em todos os breakpoints
- [ ] Textos permanecem legíveis em todos os tamanhos
- [ ] Botões e controles têm tamanho adequado para toque
- [ ] Formulários são utilizáveis em dispositivos móveis
- [ ] Tabelas são legíveis ou transformadas adequadamente
- [ ] Navegação funciona corretamente em todos os dispositivos
- [ ] Performance é aceitável em dispositivos móveis
- [ ] Elementos não se sobrepõem ou desaparecem
- [ ] Imagens e mídias são exibidas corretamente

### Ferramentas de Teste
- Chrome DevTools Device Toolbar
- Firefox Responsive Design Mode
- Testes em dispositivos reais
- Ferramentas de emulação mobile
- Lighthouse para auditoria de responsividade

## Padrões de Design

### Consistência
- Manter os mesmos componentes e padrões em todos os breakpoints
- Preservar a identidade visual em todos os dispositivos
- Manter comportamentos consistentes entre plataformas

### Experiência Adaptativa
- Ajustar a complexidade da interface conforme o dispositivo
- Priorizar funcionalidades essenciais em dispositivos menores
- Aproveitar recursos adicionais em dispositivos maiores