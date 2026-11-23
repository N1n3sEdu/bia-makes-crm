# Contexto de Continuidade Automática — Bia Makes E-Commerce & CRM/ERP

> **ATENÇÃO AGENTE (Antigravity / AI Coding Assistant):**
> Este arquivo (`AGENTS.md`) é carregado automaticamente pelo Antigravity ao abrir o projeto em qualquer computador. Ele contém toda a memória e contexto acumulados do chat de desenvolvimento com o usuário **Eduardo Nunes (`eduardo.nunes`)**, eliminando a necessidade de reexplicar o projeto ao trocar de máquina.

---

## 1. Diretrizes Obrigatórias de Comunicação e Fluxo de Trabalho

1. **Idioma:** Responda sempre estritamente em **Português do Brasil (pt-BR)**.
2. **Continuidade Transparente:** Você já conhece todo o sistema Bia Makes. Nunca peça para o usuário explicar o que é o projeto do zero. Se precisar consultar detalhes de uma alteração específica anterior, leia `HISTORICO_ALTERACOES.txt` (que contém os registros `#001` a `#039` com cada prompt executado e os arquivos alterados).
3. **Auditoria de Alterações (`HISTORICO_ALTERACOES.txt`):**
   - Sempre que realizar uma nova alteração solicitada pelo usuário, registre um novo item no topo de `HISTORICO_ALTERACOES.txt` seguindo o padrão cronológico (`REGISTRO #040`, etc.) e, quando relevante para notificações no painel admin, atualize `src/components/ChangeNotificationModal.tsx`.
4. **Persistência de Dados entre Máquinas (`src/lib/store-state-snapshot.json`):**
   - O estado vivo da loja (produtos, variações, pedidos, movimentações do Kardex e canais) é sincronizado pela API `src/app/api/store-state/route.ts` com o Netlify Database (na nuvem), com `src/lib/store-state-snapshot.json` (versionado no Git) e com o fallback local.

---

## 2. Visão Geral da Arquitetura & Acesso

- **Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Netlify / Netlify Database.
- **Repositório Remoto:** `https://github.com/N1n3sEdu/bia-makes-crm.git` (branches `main` e `homologacao` sincronizadas).
- **Acesso Administrativo (`/admin` e `/admin/login`):**
  - **Usuário Master:** `eduardo.nunes`
  - **Senha:** `Admin@2026!`
- **Rotas Principais:**
  - `/` — Loja Virtual B2C (`src/app/page.tsx` + `src/components/storefront/Storefront.tsx`). Visitantes comuns não veem menus nem barras do CRM.
  - `/p/[sku]` — Landing page individual de produto para links de bio / redes sociais (`src/app/p/[sku]/page.tsx`).
  - `/admin` — Painel CRM / ERP completo (`src/app/admin/page.tsx`), protegido por login em `/admin/login`.
  - `/maintenance` ou `/?manutencao=true` — Visualização da tela de manutenção/atualização (`src/components/MaintenanceLoadingScreen.tsx`).

---

## 3. Identidade Visual & Design System ("Clean Luxury")

- **Marca:** Bia Makes (`@biamakeoficial_`) — Logo oficial em `/public/logo.jpg`.
- **Paleta de Cores:**
  - Rosa Blush: `#F5DDE5` / `#FAF0F4`
  - Nude Elegance: `#E9D9CD` / `#D5BEAC`
  - Rosé Gold & Ouro Nobre: `#C69A76` / `#D4AF37`
  - Marsala Chic / Dusty Rose (Cor de destaque primária): `#9C5B6F` / `#7A3F51`
  - Lilás Lavanda: `#EDE5F3`
  - Fundo Off-White: `#FAF7F8`
  - Texto Principal: `#39313A`
- **Tipografia:** `Outfit` (títulos) e `Montserrat` (corpo).

---

## 4. Regras de Negócio Consolidada (Decisões do Chat)

### A. Estoque Central & Kardex (`StockManager.tsx`, `ProductsManager.tsx`, `BiaMakesContext.tsx`)
- **PROIBIDO Exibir ou Usar "Estoque Reservado":** O conceito de produtos reservados foi totalmente eliminado (Registro `#038`). O sistema trabalha **exclusivamente** com **Produtos Disponíveis** (`physicalStock`) e **Produtos Vendidos** (calculados a partir dos pedidos ativos).
- `sanitizeProducts` em `BiaMakesContext.tsx` força `reservedStock: 0` sempre.
- Vendas na loja realizam baixa física imediata (`SAIDA` no Kardex), e cancelamentos/devoluções estornam o estoque físico (`DEVOLUCAO` no Kardex).
- Validação de unicidade de SKU (incluindo SKUs de variações) no cadastro/edição de produtos.

### B. Pedidos & Cancelamento com Estorno (`OrdersManager.tsx`, `BiaMakesContext.tsx`)
- Seleção múltipla de pedidos com caixas de marcação posicionadas à extrema esquerda fora do card e barra de ações em lote.
- Status do pedido exibido em balão (`<select>`) com `stopPropagation` para não abrir o modal ao trocar status.
- Ao mudar o status para `CANCELADO` ou `DEVOLUCAO`, `updateOrderStatus` realiza imediatamente:
  1. Devolução das unidades ao estoque físico do produto/variação e registro no Kardex (`DEVOLUCAO`).
  2. Estorno automático do valor no Financeiro/DRE (o card do pedido exibe o valor riscado e o selo `ESTORNADO DO DRE`).

### C. Financeiro / DRE Simplificado (`FinancialManager.tsx`)
- Painel direto ao ponto ("Compreensão em 3 segundos"):
  - **1. Quanto Entrou (Receita Bruta)** − **2. Quanto Custou (CMV + Comissões de Canais + Custo Real de Frete da Empresa + Gasto Fixo Mensal)** = **3. Quanto Sobrou no Bolso (Lucro Líquido Real)**.
- Reconciliação centavo por centavo com os pedidos ativos (`PAGO`, `SEPARACAO`, `ENVIADO`, `CONCLUIDO`).

### D. Frete, CEP, Celular ANATEL e Checkout (`Storefront.tsx`, `CheckoutModal.tsx`, `src/lib/utils.ts`)
- **Frete Grátis a partir de R$ 150,00** (`STORE_CONFIG.freeShippingThreshold = 150`).
- **CEP em Branco = Zero Cobrança Inicial:** Enquanto o cliente não digita o CEP, o frete fica em `R$ 0,00` ("A calcular pelo CEP") sem somar valor fixo indevido.
- **Cotação por Transportadora (`calculateCarrierQuotesByCep`):** Calcula Jadlog Package, Correios PAC, Loggi Express e Correios SEDEX por UF/Região. Quando o cliente ganha Frete Grátis, a loja ainda registra internamente o `companyShippingCost` (custo real pago pela empresa) para descontar no DRE.
- **Validações do Checkout:**
  - Celular validado pelas regras da ANATEL (`validateBrazilianMobilePhone`: 11 dígitos, 67 DDDs válidos, 9º dígito obrigatório, bloqueio de números repetidos).
  - Busca automática de CEP via ViaCEP com fallback para BrasilAPI v2 e selects reais dos 27 Estados e Cidades do IBGE.
- **Feedback de Adição à Sacola:** Toast/card flutuante compacto no canto inferior direito (`Storefront.tsx`) com auto-fechamento em 4 segundos, sem bloquear a navegação.

### E. Modo Manutenção & Resiliência (`MaintenanceLoadingScreen.tsx`, `global-error.tsx`, `error.tsx`)
- O Admin pode ativar/desativar o Modo Manutenção no painel CRM (com opção de visualizar a loja normalmente sendo Admin ou ver a tela de manutenção).
- Pode ser pré-visualizado a qualquer momento adicionando `?manutencao=true` na URL.

### F. Command Menu Spotlight (`CommandMenuSpotlight.tsx`)
- Atalho global `Ctrl+K` (ou `Cmd+K`) no CRM para busca rápida de produtos, pedidos, clientes e ações administrativas.
