# PROJETO OFICIAL (EXPANDIDO & APRIMORADO) — BIA MAKES: E-COMMERCE & CRM/ERP HUB

> **Documento de Especificação de Requisitos e Arquitetura de Software**  
> **Marca:** Bia Makes (`@biamakeoficial_`)  
> **Escopo:** Loja Virtual B2C de Cosméticos (Pública) & Sistema Central ERP/CRM Restrito a Administradores

---

## 1. VISÃO GERAL E SEPARAÇÃO DE AMBIENTES

O ecossistema digital **Bia Makes** é dividido em rotas independentes com controle estrito de visibilidade:
1. **Loja Virtual Pública (`/`):** Exclusiva para clientes finais (B2C). O painel administrativo CRM/ERP fica 100% oculto para visitantes comuns.
2. **Vitrine de Link para Redes Sociais (`/p/[sku]`):** Página dedicada de alta conversão para compartilhamento no Instagram (`@biamakeoficial_`), Bio, Stories, TikTok e WhatsApp, exibindo **estoque disponível embutido em tempo real**, **valor do frete embutido** (com simulador de CEP) e botões para as redes vinculadas.
3. **Portal Administrativo Restrito (`/admin` e `/admin/login`):** Acessível somente mediante autenticação de administradores e funcionários autorizados (RBAC: Admin, Gerente, Estoque, Vendas, Financeiro). Qualquer alteração realizada no `/admin` reflete instantaneamente na Loja Virtual (`/`).

---

## 2. IDENTIDADE VISUAL & TIPOGRAFIA ADAPTADA

- **Conceito:** *Clean Luxury Beauty* — Sofisticado, elegante, feminino, moderno e de alta legibilidade.
- **Tipografia Moderna Adaptada:**
  - **Títulos & Destaques (`font-display`):** `Outfit` — Geométrica contemporânea, elegante e limpa em qualquer resolução.
  - **Interface, Tabelas, Preços e Leitura (`font-sans`):** `Montserrat` / `Plus Jakarta Sans` — Excelente leitura para números, tabelas financeiras do CRM e descrições cosméticas.
- **Paleta de Cores Oficial:**
  - **Rosa Blush Primário:** `#F5DDE5`
  - **Nude Suave:** `#E9D9CD`
  - **Rosé Gold / Dourado:** `#C69A76` / `#D4AF37`
  - **Marsala / Dusty Rose:** `#9C5B6F` / `#7A3F51`
  - **Lilás Lavanda:** `#EDE5F3`
  - **Off-white Fundo:** `#FAF7F8`
  - **Branco Puro:** `#FFFFFF`
  - **Grafite / Texto:** `#39313A`

---

## 3. VINCULAÇÃO DE REDES SOCIAIS COM ESTOQUE E FRETE EMBUTIDO

Cada produto cadastrado no CRM possui um módulo de **Redes & Canais Vinculados**:
- **Campos de Vinculação por Produto:**
  - URL do Post/Reel no Instagram (`@biamakeoficial_`)
  - URL do Produto na Shopee
  - URL do Produto no Mercado Livre
  - URL do Produto no TikTok Shop / Amazon
  - **Valor de Frete Embutido (`shippingValue`)** e flag de **Frete Grátis (`freeShipping`)**.
- **Comportamento na Vitrine e nos Links das Redes (`/p/[sku]`):**
  - Exibe o **contador de estoque central em tempo real** (ex: `73 unidades disponíveis`).
  - Exibe o **valor do frete embutido** diretamente no card do produto e permite simular o CEP (PAC, SEDEX e Entrega Expressa).
  - Permite que a cliente compre diretamente pelo site, pelo WhatsApp (com resumo do estoque e frete já calculado) ou clique nos links das redes/marketplaces vinculados.

---

## 4. MÓDULOS DO PAINEL ADMIN (`/admin`)

1. **Autenticação & Controle de Acesso (`/admin/login`):** Login protegido por credenciais e perfis de permissão (Admin, Gerente, Estoque, Vendas, Financeiro).
2. **Dashboard Executivo:** Faturamento bruto, lucro líquido real, pedidos multicanal, alertas de estoque crítico e alertas ANVISA de validade (< 90 dias).
3. **Cadastro & Edição de Produtos (`ProductsManager`):** Gestão de SKU, EAN-13, lotes, validades, variações de tons (color swatches), valor de frete do produto e links das redes sociais.
4. **Controle Central de Estoque (`StockManager`):** Estoque físico, reservado, disponível, segurança e histórico imutável de movimentações (Kardex).
5. **Central de Vendas & Pedidos (`OrdersManager`):** Gestão de pedidos do Site, Mercado Livre, Shopee, TikTok Shop e Balcão.
6. **Hub de Marketplaces (`MarketplacesManager`):** Conectores de canais e laboratório de teste de **idempotência de webhooks** (impede baixa duplicada de estoque).
7. **Financeiro & DRE (`FinancialManager`):** Demonstrativo do Resultado do Exercício com deduções de taxas de marketplaces, CMV e lucro líquido.
8. **Importação e Exportação (`ImportExportManager`):** Upload e download de planilhas CSV padronizadas.
