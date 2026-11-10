# 📋 ROTEIRO OFICIAL DE HOMOLOGAÇÃO — BIA MAKES CRM & LOJA VIRTUAL

> **Responsável / Admin Master:** Eduardo Nunes (`eduardo.nunes`)  
> **Marca:** Bia Makes (`@biamakeoficial_`)  
> **Ambiente:** Homologação / Staging

---

## ✅ 1. Checklist de Homologação Funcional

### A. Ambiente Público — Loja Virtual B2C (`/`)
- [x] **Ocultação do CRM para Clientes:** Visitantes comuns acessando `http://localhost:3000/` visualizam apenas a Loja Virtual, sem exposição das abas administrativas.
- [x] **Identidade Visual & Tipografia:** Fontes `Outfit` e `Montserrat` aplicadas, paleta Rosa Blush (`#F5DDE5`), Nude (`#E9D9CD`), Rosé Gold (`#C69A76`) e Marsala (`#9C5B6F`), com Logo oficial em alta definição.
- [x] **Estoque e Frete Embutidos nos Cards:** Cada produto exibe o estoque disponível sincronizado com a central e o valor de frete base (ou selo de Frete Grátis).
- [x] **Links das Redes Vinculadas:** Botões diretos em cada produto para Instagram (`@biamakeoficial_`), Shopee, Mercado Livre, TikTok Shop e botão `Link Bio`.
- [x] **Sacola & Checkout WhatsApp:** Adição de variações/tons, cupom `BIAMAKE10` (10% OFF), cálculo de frete e geração automática do pedido para o WhatsApp oficial.

### B. Ambiente de Links para Redes Sociais (`/p/[sku]`)
- [x] **Vitrine Exclusiva por Produto:** Acesso via `/p/BM-BASE-01` (e demais SKUs) exibindo foto, seleção de tonalidade, estoque disponível em tempo real e valor do frete embutido.
- [x] **Simulador de Frete por CEP:** Cálculo instantâneo de PAC, SEDEX e Entrega Expressa.
- [x] **Redirecionamento Multicanal:** Botões para compra direta no WhatsApp, Sacola do Site ou canais integrados (Shopee, Mercado Livre, TikTok Shop, Instagram).

### C. Ambiente Administrativo Restrito (`/admin` e `/admin/login`)
- [x] **Autenticação por Usuário e Senha:**
  - Login limpo com campos **Usuário** e **Senha**, botão **Acessar** e sem caixa de testes.
  - Usuário Admin Master ativo: `eduardo.nunes` / `Admin@2026!`.
- [x] **Aba Usuários & Perfis (`UsersManager`):**
  - Criação e edição de funcionários com ajuste automático dos módulos visíveis conforme o cargo (`ADMIN`, `GERENTE`, `ESTOQUE`, `VENDAS`, `FINANCEIRO`).
- [x] **Aba Produtos, Frete & Redes (`ProductsManager`):**
  - Cadastro e edição de SKU, EAN-13, custo, venda, margem automática, valor de frete embutido, lote/validade ANVISA e links das redes sociais.
- [x] **Aba Estoque Central (`StockManager`):**
  - Controle de estoque físico, reservado, disponível, mínimo de segurança e histórico Kardex auditável.
- [x] **Aba Canais & Marketplaces (`MarketplacesManager`):**
  - Sincronização de estoque, modal de configuração/vinculação de conta (Mercado Livre, Shopee, Amazon, TikTok Shop, Shein, Magalu) e simulador de idempotência de webhooks.
- [x] **Aba Financeiro & DRE (`FinancialManager`):**
  - Demonstrativo de resultado com receita bruta, taxas de marketplaces, CMV, despesas e lucro líquido real.
- [x] **Aba Importar Planilhas (`ImportExportManager`):**
  - Download de modelo CSV e importação/exportação de catálogo.
