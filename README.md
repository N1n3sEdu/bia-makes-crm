# BIA MAKES — E-COMMERCE & CRM/ERP HUB 💄✨

> Sistema web profissional de vendas de cosméticos e maquiagem feminina e central integrada de gestão ERP/CRM multicanal da marca **Bia Makes** (`@biamakeoficial_`).

---

## 📸 IDENTIDADE VISUAL & LOGO OFICIAL

O projeto incorpora integralmente a identidade visual e a logomarca oficial da loja (`/public/logo.jpg`), utilizando os elementos femininos, luxuosos e sofisticados:
- **Logo Oficial:** Distintivo circular com arabesco dourado, lettering cursivo "Bia", caixa alta "MAKE", ícones de pincel e batom, coração central e link para o Instagram `@biamakeoficial_`.
- **Paleta de Cores Exclusiva:**
  - **Rosa Blush:** `#F5DDE5` / `#FAF0F4`
  - **Nude Elegance:** `#E9D9CD` / `#D5BEAC`
  - **Rosé Gold & Ouro Nobre:** `#C69A76` / `#D4AF37`
  - **Marsala Chic / Dusty Rose:** `#9C5B6F` / `#7A3F51`
  - **Lilás Lavanda:** `#EDE5F3`
  - **Off-white Fundo:** `#FAF7F8`
  - **Texto Alta Legibilidade:** `#39313A`

---

## 🌟 O QUE ESTÁ IMPLEMENTADO

O projeto conta com **duas experiências completas em uma única plataforma unificada**, acessíveis através do alternador de modo no topo da tela:

### 1. 🛍️ Loja Virtual (Storefront B2C)
- **Hero Banner Luxuoso:** Destaque para a nova coleção, selos de qualidade (*Cruelty-Free*, *Fórmulas HD*, *Envio Rápido*) e link para o Instagram oficial.
- **Catálogo Inteligente:** Filtros por categorias (Rosto, Lábios, Olhos, Pincéis & Acessórios, Skincare) e busca em tempo real.
- **Cards de Maquiagem:** Fotos em alta resolução, avaliações reais, badges de desconto/promoção, seletores interativos de tonalidades de pele/batom (swatches coloridos) e status de estoque dinâmico.
- **Sacola de Compras (Drawer Lateral):**
  - Adição e remoção de itens com variação de cor.
  - Simulador de frete grátis (> R$ 149,00).
  - Campo de cupom de desconto (teste com `BIAMAKE10` para 10% OFF).
  - **Finalização Inteligente via WhatsApp Oficial:** Monta automaticamente a mensagem estruturada com lista de produtos, quantidades, tons escolhidos e valor total para envio com 1 clique!
  - Opção de pagamento seguro e PIX.
- **Modal de Visualização Rápida (Quick View):** Detalhes da fórmula, lote de fabricação e data de validade.

### 2. ⚙️ Painel Bia Makes CRM / ERP (Backoffice Administrativo)
- **Dashboard Executivo:**
  - Faturamento Bruto, Lucro Líquido Real, Margem Líquida (%) e Pedidos Processados.
  - Alertas automáticos de **Estoque Crítico** (ponto de reposição).
  - Alertas de **Conformidade ANVISA**: listagem de lotes cosméticos com validade inferior a 90 dias.
  - Gráfico de canais de venda e tabela de últimas vendas.
- **Tráfego & Origem dos Clientes (Novo Hub de Analytics):**
  - Mapeamento determinístico de visitantes (Instagram, TikTok, WhatsApp, Google, Facebook, Direto).
  - Contagem real de acessos (`pageviews`), visitantes únicos (`visitor_id`), cliques em links e taxa de conversão em vendas no WhatsApp.
  - Gráfico temporal interativo (por hora hoje e por dia nos demais períodos) e Funil de Compras com detecção automática de gargalos.
  - Top 10 cosméticos mais visualizados e selo "Muito visto, pouco vendido".
  - Gestão de Links Rastreáveis com gerador automático de QR Code para impressão em embalagens e etiquetas.
  - Heatmap 7x24 com indicação dos melhores dias e horários para postar stories e reels.
  - Bloco recolhível de taxas dos canais para o DRE Financeiro.
- **Catálogo & Cadastro de Produtos:**
  - Listagem com filtros, cálculo em tempo real de margem de lucro (Preço de Venda vs Preço de Custo).
  - Modal completo para cadastrar novos produtos e editar existentes com SKU, EAN-13, lote, validade e variações de cores/tons.
- **Controle Central de Estoque (Kardex):**
  - Visão quádrupla: Estoque Físico, Reservado, Disponível e Segurança.
  - Modal de ajuste rápido (Entrada por Compra, Saída, Ajuste de Inventário, Devolução).
  - Tabela de Auditoria com log de todas as movimentações.
- **Central de Pedidos & Vendas Multicanal:**
  - Pedidos unificados de Mercado Livre, Shopee, Amazon, TikTok Shop e Loja Virtual.
  - Mudança de status em tempo real (*Pendente -> Pago -> Em Separação -> Enviado -> Concluído*).
  - Modal com detalhamento de cliente, itens e código de rastreamento.
- **Central de Marketplaces:**
  - Status de conexão de Mercado Livre, Shopee, Amazon, TikTok Shop, Magalu e Shein.
  - Botão de sincronização em tempo real de estoque e preços.
  - **Laboratório de Teste de Idempotência:** Simulador que prova que o envio de notificações repetidas do mesmo pedido não provoca baixas duplicadas de estoque.
- **Financeiro & DRE Gerencial:**
  - Demonstrativo do Resultado do Exercício (Receita Bruta - Taxas de Canais - CMV - Despesas = Lucro Líquido Real).
  - Tabela comparativa de rentabilidade e margem por canal.
- **Importação & Exportação de Planilhas:**
  - Download imediato da **Planilha Modelo CSV de Cosméticos**.
  - Upload com validação e pré-visualização de dados antes da gravação definitiva.
  - Exportação de inventário completo em formato CSV.

---

## 🚀 COMO EXECUTAR O PROJETO

### Pré-requisitos
- **Node.js** (v18 ou superior — já testado na sua máquina com Node v26).

### 1. Iniciar a Aplicação Web Completa (Next.js)
Abra o terminal nesta pasta (`c:\Users\EduardoNunesTeixeira\Desktop\Bia Makes`) e execute:

```bash
npm run dev
```

Abra o seu navegador em:
👉 **http://localhost:3000**

### 2. Rodando com Netlify CLI & Netlify Database (Analytics & Geolocalização)
Para executar com o banco de dados Postgres gerenciado da Netlify e emulação dos cabeçalhos de geolocalização (`x-nf-geo`):

```bash
# 1. Instalar a CLI da Netlify (se ainda não tiver)
npm install -g netlify-cli

# 2. Conectar ao site ou rodar o dev server com banco provisionado
netlify dev
```

#### Variáveis de Ambiente Recomendadas:
- `NETLIFY_DB_URL`: String de conexão Postgres gerenciada automaticamente pelo Netlify Database.
- `ANALYTICS_ADMIN_TOKEN`: Token secreto do servidor para proteger os endpoints de leitura de analytics (`/api/analytics` e `/api/links`).

#### Migrations do Banco de Dados:
As migrations ficam na pasta `netlify/database/migrations/`:
- `0001_traffic_analytics.sql`: Cria as tabelas `analytics_events` e `tracked_links` com índices de performance para data, tipo de evento, origem e sessão. A Netlify aplica as migrations automaticamente no deploy ou via `netlify db:migrate`.

Você terá imediatamente acesso à Loja Virtual e ao Painel CRM completo com todas as telas, botões, modais e cálculos funcionando!

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS & BACKEND PYTHON

Também foram incluídos os arquivos de infraestrutura e backend para quando desejar rodar o microserviço FastAPI com PostgreSQL:

1. **`database/schema.sql`:** Script DDL com todas as tabelas (users, categories, products, product_variations, stock_movements, orders, order_items, marketplace_channels, customers), chaves estrangeiras, índices e constraints.
2. **`database/seed.sql`:** Carga inicial de categorias, canais e usuário administrador inicial.
3. **`backend/`:**
   - `main.py`: API FastAPI com endpoints e webhook idempotente.
   - `models.py`: Modelos relacionais SQLAlchemy.
   - `schemas.py`: Schemas de validação Pydantic v2.
   - `tasks.py`: Tarefas Celery para sincronização assíncrona com Redis.
   - `requirements.txt`: Dependências Python.

---

## 📄 PROMPT MELHORADO

O documento oficial com a versão melhorada, altamente detalhada e estruturada do seu prompt original foi salvo em:
👉 **`PROMPT_MELHORADO_BIA_MAKES.md`**

---

*Desenvolvido com sofisticação e precisão para a **Bia Makes** (`@biamakeoficial_`).*
