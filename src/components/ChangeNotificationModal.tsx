"use client";

import React, { useState, useEffect } from "react";
import { useBiaMakes } from "@/context/BiaMakesContext";
import { Bell, X, Clock, FileText, CheckCircle, ChevronRight, RotateCcw } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface SystemChangeLogItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  filesModified: string[];
  reversalGuide: string;
}

// Histórico de alterações estruturado para exibição do usuário eduardo.nunes
export const SYSTEM_CHANGE_LOGS: SystemChangeLogItem[] = [
  {
    id: "change-2026-11-12-24",
    timestamp: "2026-11-12T14:15:00-03:00",
    title: "Frete Zerado em Branco & Cálculo Automático por CEP na Sacola",
    description: `1. Zero Cobrança com CEP em Branco: No Quick View (Storefront.tsx) e na página /p/[sku], quando o campo de CEP está vazio o quadro de frete não exibe mais valor fixo em reais (ex: R$ 9,90 ou R$ 13,50), mostrando "A calcular pelo CEP" (ou "FRETE GRÁTIS" quando aplicável) com frete = 0 no total.
2. Cálculo de CEP Direto na Sacola: Incluído bloco de cálculo de CEP e seleção de transportadoras dentro do Drawer da Sacola em Storefront.tsx, com busca automática no 8º dígito e atualização em tempo real do frete e do total.
3. Sincronização Completa com o Checkout: CheckoutModal.tsx recebe o CEP, localidade e transportadora já escolhidos na Sacola ou página do produto e mantém o frete em R$ 0,00 até o CEP ser informado.`,
    filesModified: [
      "src/components/storefront/Storefront.tsx",
      "src/components/storefront/CheckoutModal.tsx",
      "src/app/p/[sku]/page.tsx",
    ],
    reversalGuide: "Reverter alterações de frete em branco nos 3 arquivos via git.",
  },
  {
    id: "change-2026-11-12-23",
    timestamp: "2026-11-12T13:52:00-03:00",
    title: "Cotação Real de Transportadoras por CEP e Custo de Frete da Empresa no CRM & Financeiro",
    description: `1. Nova Regra de Frete Grátis (R$ 150,00) & Cotação por Transportadora: Atualizado STORE_CONFIG.freeShippingThreshold para R$ 150,00 e criada calculateCarrierQuotesByCep em src/lib/utils.ts calculando Jadlog Package, Correios PAC, Loggi Express e Correios SEDEX conforme UF/Região e quantidade de itens.
2. Separação entre Frete Cobrado do Cliente vs. Custo Real Pago pela Loja: No CheckoutModal e /p/[sku], compras acima de R$ 150 (ou itens com frete grátis) mostram GRÁTIS nas modalidades econômicas, enquanto companyShippingCost grava sempre o valor real pago pela Bia Makes à transportadora.
3. Pedidos e Financeiro 100% Reconciliados: OrdersManager exibe a transportadora, o status de Frete Grátis e o custo pago pela loja na tabela e no Raio-X da Encomenda; BiaMakesContext e FinancialManager descontam obrigatoriamente o frete pago pela empresa do Lucro Líquido Real.`,
    filesModified: [
      "src/types/index.ts",
      "src/lib/data.ts",
      "src/lib/utils.ts",
      "src/context/BiaMakesContext.tsx",
      "src/components/storefront/CheckoutModal.tsx",
      "src/components/storefront/Storefront.tsx",
      "src/app/p/[sku]/page.tsx",
      "src/components/crm/OrdersManager.tsx",
      "src/components/crm/FinancialManager.tsx",
    ],
    reversalGuide: "Reverter alterações logísticas e de frete via git nos arquivos listados.",
  },
  {
    id: "change-2026-11-12-22",
    timestamp: "2026-11-12T13:42:00-03:00",
    title: "Checkout Inteligente: Validação ANATEL de Celular, CEP Duplo e Estados/Cidades do Brasil",
    description: `1. Validador de Celular ANATEL (validateBrazilianMobilePhone): Exige 11 dígitos, um dos 67 DDDs válidos do Brasil, 9º dígito obrigatório, 4º dígito diferente de 0 e bloqueia dígitos repetidos ((11) 11111-1111, (11) 99999-9999) ou sequências de teste com feedback imediato no campo WhatsApp.
2. Busca de CEP Aprimorada: Bloqueio de CEPs com dígitos repetidos (ex: 11111-111), consulta ao ViaCEP com fallback automático para BrasilAPI v2, indicador visual "Buscando endereço...", erro explícito para CEP inexistente e foco automático no campo Número.
3. Selects Reais de Estado (27 UFs) e Cidades (IBGE): Substituição dos campos abertos de UF e Cidade por selects sincronizados com a API do IBGE (com cache em memória e dicionário offline de fallback para todos os 27 estados).`,
    filesModified: [
      "src/lib/utils.ts",
      "src/components/storefront/CheckoutModal.tsx",
    ],
    reversalGuide: "Reverter alterações em src/lib/utils.ts e src/components/storefront/CheckoutModal.tsx via git.",
  },
  {
    id: "change-2026-11-12-21",
    timestamp: "2026-11-12T13:10:00-03:00",
    title: "Novo Financeiro do Admin (Compreensão em 3 Segundos)",
    description: `1. Clareza Absoluta em 4 Blocos: O arquivo FinancialManager.tsx foi reescrito do zero para eliminar jargões contábeis, sub-abas internas e números fictícios fixos (como MONTHLY_12_MONTHS_HISTORY e "+18.4%").
2. Painel "Conta de Padaria": Mostra de imediato 1. Quanto Entrou − 2. Quanto Custou = 3. Quanto Sobrou no Bolso + faixa de status rápido (Vendas de Hoje, Aguardando Pagamento e Cancelados/Devolvidos), além de banner âmbar com atalho para Pedidos quando há pagamentos pendentes.
3. Raio-X e Extrato Reconciliado: Barra proporcional de custos com Gasto Fixo Mensal editável (localStorage "biamakes_monthly_opex_v1"), tabela de Vendas por Canal, exportação CSV com BOM UTF-8 (;) e Extrato de Pedidos com rodapé batendo centavo por centavo com o Lucro Real.`,
    filesModified: ["src/components/crm/FinancialManager.tsx"],
    reversalGuide: "Restaurar a versão anterior de src/components/crm/FinancialManager.tsx via git checkout.",
  },
  {
    id: "change-2026-11-12-20",
    timestamp: "2026-11-12T13:07:00-03:00",
    title: "Integração Real-Time entre Site Comercial e Admin CRM (Vendas, Estoque e Financeiro)",
    description: `1. Correção de Status & Baixa de Estoque em Checkout: Compras feitas na loja via PIX ou Cartão agora são criadas com status PAGO, baixam imediatamente o physicalStock (e variação) com registro SAIDA no Kardex e contabilizam instantaneamente no Faturamento Bruto, Vendas do Dia, Meta Mensal e DRE.
2. Conversão de Reservas WhatsApp: Pedidos pelo botão WhatsApp da Sacola e da página /p/[sku] também são gravados no CRM como PENDENTE com reserva (RESERVA no Kardex), e ao aprovar/cancelar no Admin a baixa física ou liberação ocorre corretamente.
3. Sincronização Multi-Aba e Multi-Navegador (/api/store-state): Adicionada API /api/store-state com persistência em Netlify DB (ou fallback local em tmp) + BroadcastChannel + sincronização no foco da aba, além da correção de persistência síncrona no localStorage em BiaMakesContext.tsx.`,
    filesModified: [
      "src/context/BiaMakesContext.tsx",
      "src/app/api/store-state/route.ts",
      "src/components/storefront/Storefront.tsx",
      "src/components/storefront/CheckoutModal.tsx",
      "src/app/p/[sku]/page.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter a integração entre storefront e admin:
1. Remover src/app/api/store-state/route.ts e restaurar BiaMakesContext.tsx, Storefront.tsx, CheckoutModal.tsx e /p/[sku]/page.tsx pelo Git.`
  },
  {
    id: "change-2026-11-12-19",
    timestamp: "2026-11-12T12:49:00-03:00",
    title: "Redesign Limpo dos Cards de Produto na Vitrine",
    description: `1. Remoção de Poluição Visual nos Cards: Excluídas as pills/tags dermatológicas, a linha técnica CATEGORIA • SKU + avaliação, o box de Estoque Central / Valor do Frete / Redes Vinculadas e o botão Share2 da foto dos cards na vitrine.
2. Hierarquia Clean Luxury: O corpo de cada card agora exibe exclusivamente Nome do Produto, Descrição, Seletor de Tom (swatches interativos com stopPropagation) e Bloco Inferior fixado na base com Valor (preço riscado, preço principal em 2xl e parcelamento) + Botão Comprar.
3. Altura Padronizada no Grid: Aplicado grid com gap-7 e h-full flex flex-col nos cards para alinhamento horizontal uniforme entre todas as colunas.`,
    filesModified: [
      "src/components/storefront/Storefront.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para restaurar o layout completo antigo dos cards na vitrine:
1. Restaurar src/components/storefront/Storefront.tsx pelo histórico do Git.`
  },
  {
    id: "change-2026-11-12-18",
    timestamp: "2026-11-12T12:41:00-03:00",
    title: "SEO Dinâmico, Open Graph (WhatsApp/Instagram), JSON-LD e API ViaCEP Real",
    description: `1. Metadados Dinâmicos & Open Graph em /p/[sku]: Criado Server Component src/app/p/[sku]/layout.tsx com generateMetadata gerando título com preço, descrição com estoque/frete e openGraph.images para preview rico no WhatsApp, Instagram Direct e redes sociais, além de script JSON-LD (Schema.org Product + Offer BRL + Availability) para Google Shopping.
2. Integração Real com ViaCEP: Criado utilitário fetchCepInfo e formatCepMask em src/lib/utils.ts consultando viacep.com.br com timeout de 3s e fallback offline inteligente.
3. Máscara 00000-000 e Erro Inline: Atualizados simuladores de CEP do Quick View (Storefront.tsx), página /p/[sku]/page.tsx e CheckoutModal.tsx com máscara automática, bairro/cidade/UF reais, prazos dinâmicos por UF (SP: 1-3 dias; Sudeste/Sul: 2-5 dias; Demais regiões: 4-8 dias úteis) e validação vermelha inline sem alert().`,
    filesModified: [
      "src/app/p/[sku]/layout.tsx",
      "src/app/layout.tsx",
      "src/lib/utils.ts",
      "src/components/storefront/Storefront.tsx",
      "src/app/p/[sku]/page.tsx",
      "src/components/storefront/CheckoutModal.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter metadados dinâmicos ou ViaCEP:
1. Remover src/app/p/[sku]/layout.tsx e restaurar utils.ts, Storefront.tsx, /p/[sku]/page.tsx e CheckoutModal.tsx pelo Git.`
  },
  {
    id: "change-2026-11-12-17",
    timestamp: "2026-11-12T12:36:00-03:00",
    title: "Ordenação, Tags Dermatológicas nos Cards, Busca Ampliada por SKU e Lista de Favoritos",
    description: `1. Tags Dermatológicas na Vitrine: Exibidas as tags de benefícios de cada produto (Vegano, Cruelty-Free, Ácido Hialurônico, Vitamina E, etc.) diretamente nos cards da vitrine abaixo da descrição curta.
2. Busca Ampliada (SKU, Descrição e Tags) e Ordenação: O filtro de busca agora localiza produtos por nome, categoria, marca, SKU (ex: BM-BASE-01), descrição e tags dermatológicas (com normalização de acentos). Adicionado seletor de ordenação com opções Destaques, Menor Preço, Maior Preço, Melhor Avaliação e Maior % de Desconto.
3. Lista de Favoritos (Wishlist): Adicionado botão Heart no canto da imagem dos cards e filtro rápido "Meus Favoritos (X)" ao lado das categorias com persistência em localStorage (biamakes_wishlist_v1).
4. Toast Notification na Sacola: Ao adicionar um item na vitrine ou no Quick View, exibe notificação flutuante elegante ("✨ [Produto] adicionado à sua sacola!") com botões "Abrir Sacola" e "Continuar comprando".`,
    filesModified: [
      "src/components/storefront/Storefront.tsx",
      "src/context/BiaMakesContext.tsx",
      "src/app/page.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter para a vitrine sem ordenação/favoritos/toast:
1. Restaurar Storefront.tsx, BiaMakesContext.tsx e src/app/page.tsx pelo histórico do Git.`
  },
  {
    id: "change-2026-11-12-16",
    timestamp: "2026-11-12T12:32:00-03:00",
    title: "Design System Clean Luxury, next/font, Acessibilidade WCAG AA e Barra de Frete Grátis",
    description: `1. Otimização de Fontes via next/font/google: Substituído <link> externo em layout.tsx por Montserrat e Outfit com display: 'swap' e variáveis CSS (--font-montserrat, --font-outfit) conectadas em tailwind.config.ts e globals.css, eliminando warnings de build e CLS.
2. Novo Componente ProductImage: Criado src/components/storefront/ProductImage.tsx com fallback automático para '/logo.jpg' no onError e skeleton animado .shimmer-gold durante o carregamento.
3. Barra de Progresso de Frete Grátis na Sacola: Adicionada barra dinâmica no topo do Drawer calculando quanto falta para atingir R$ 149,00 com preenchimento em gradiente (from-bia-rosegold to-bia-marsala) e celebração em esmeralda ao desbloquear.
4. Contraste WCAG AA & Refinamento de Swatches: Adicionado ring-1 ring-inset ring-black/15 em todas as amostras circulares de tom para que cores claras (#FFFFFF, Porcelana) fiquem nítidas no card. Elevados textos de 9px/10px para 11px e opacidades mínimas para /75, padronizando tokens bia-* em Storefront, Navigation e /p/[sku].`,
    filesModified: [
      "src/app/layout.tsx",
      "tailwind.config.ts",
      "src/app/globals.css",
      "src/components/storefront/ProductImage.tsx",
      "src/components/storefront/Storefront.tsx",
      "src/components/Navigation.tsx",
      "src/app/p/[sku]/page.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter para fontes externas ou remover a barra de frete grátis:
1. Restaurar layout.tsx, tailwind.config.ts, globals.css e Storefront.tsx pelo histórico do Git.`
  },
  {
    id: "change-2026-11-12-15",
    timestamp: "2026-11-12T12:22:00-03:00",
    title: "Galeria de Imagens, Quick View Interativo e Correção da Rota /p/[sku]",
    description: `1. Correção de Fallback Silencioso em /p/[sku]/page.tsx: Removido '|| products[0]' para que links com SKUs inválidos ou removidos exibam a tela amigável de 'Produto não encontrado' com botão de retorno ao catálogo. Adicionado useEffect para sincronizar selectedVar e selectedImageIndex ao hidratar o contexto.
2. Galeria Multi-Imagens: Adicionado estado selectedImageIndex e miniaturas clicáveis (thumbnails) abaixo da foto principal tanto em /p/[sku]/page.tsx quanto no modal Quick View da vitrine.
3. Efeito Hover na Vitrine: Os cards de produtos em Storefront.tsx agora exibem suavemente a segunda foto (images[1] - swatch/textura) ao passar o mouse em desktops.
4. Quick View Completo e Sincronizado: Sincronização bidirecional entre o seletor de tons do modal e activeVariations do card, garantindo que o tom exato escolhido seja adicionado à sacola. Incluídos também dados do Lote ANVISA, Data de Validade e Tags Dermatológicas no modal e na página do produto.`,
    filesModified: [
      "src/app/p/[sku]/page.tsx",
      "src/components/storefront/Storefront.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter a galeria de imagens e o comportamento de /p/[sku]:
1. Restaurar src/app/p/[sku]/page.tsx e src/components/storefront/Storefront.tsx pelo histórico do Git.`
  },
  {
    id: "change-2026-11-12-14",
    timestamp: "2026-11-12T12:05:00-03:00",
    title: "Substituição de Marketplaces por Central de Tráfego & Origem dos Clientes com Netlify Database",
    description: `1. Infraestrutura de Analytics & Netlify Database:
   - Criada migration oficial 'netlify/database/migrations/0001_traffic_analytics.sql' com tabelas 'analytics_events' e 'tracked_links' e índices otimizados para tempo, sessão, SKU e canal.
   - Conexão nativa e parametrizada via '@netlify/database' (getDatabase / db.sql).
2. Endpoints e Coleta de Tráfego no Servidor:
   - POST '/api/track': Recebe eventos de tráfego, sanitiza inputs, filtra bots (facebookexternalhit, WhatsApp, Googlebot) e caminhos /admin, infere dispositivo/SO/navegador por User-Agent e geolocalização por 'x-nf-geo' da Netlify, com rate limit em memória.
   - GET '/api/analytics': Agregações em SQL com timezone 'America/Sao_Paulo', comparativo vs período anterior, séries temporais, ranking de origens, funil de compras, top produtos, horários de pico e feed recente. Protegido via token seguro ANALYTICS_ADMIN_TOKEN.
   - GET '/r/[code]': Redirecionador rápido (302) que registra cliques no servidor e redireciona com UTMs anexadas sem risco de Open Redirect.
   - GET/POST/PATCH '/api/links': CRUD completo de links encurtados com validação estrita de destino interno.
3. Tracker Cliente, LGPD & Rastreamento Determinístico:
   - Criados 'src/lib/analytics/track.ts', 'src/components/analytics/AnalyticsTracker.tsx' e 'CookieConsentBanner.tsx' no layout global.
   - Classificação determinística da origem: UTMs -> Click IDs (fbclid, gclid, ttclid) -> Referrer -> Direto.
   - Disparo instrumentado de eventos: 'pageview', 'product_view' (em /p/[sku] e Quick View), 'add_to_cart' (no contexto), 'begin_checkout' (no CheckoutModal), 'whatsapp_order' (no envio ao WhatsApp) e 'outbound_click' (botões sociais).
4. Nova Central de Tráfego & Origem no Admin:
   - Substituto de Marketplaces: Nova tela 'src/components/crm/TrafficManager.tsx' com 4 Hero Cards, Gráfico Temporal SVG, Ranking de Origens com barras coloridas e insight em linguagem natural, Funil de 5 etapas com destaque de gargalo, Top 10 Produtos, Heatmap 7x24, Tabela de Links Rastreáveis com gerador de QR Code em PNG, e Exportação CSV formatada para Excel PT-BR.
   - Preservação do Financeiro: Bloco recolhível discreto ao final da tela para configurar taxas de comissão e frete padrão dos canais (channels[].feePercentage), mantendo o DRE e os cálculos operacionais 100% íntegros.
   - Atualizados App Router (/admin), Spotlight (Alt+5) e rotas. Removido MarketplacesManager.tsx.`,
    filesModified: [
      "netlify/database/migrations/0001_traffic_analytics.sql",
      "src/types/analytics.ts",
      "src/types/index.ts",
      "src/lib/analytics/db.ts",
      "src/lib/analytics/track.ts",
      "src/app/api/track/route.ts",
      "src/app/api/analytics/route.ts",
      "src/app/r/[code]/route.ts",
      "src/app/api/links/route.ts",
      "src/components/analytics/AnalyticsTracker.tsx",
      "src/components/analytics/CookieConsentBanner.tsx",
      "src/components/crm/traffic/QrCodeModal.tsx",
      "src/components/crm/traffic/CreateTrackedLinkModal.tsx",
      "src/components/crm/traffic/TrafficFunnelChart.tsx",
      "src/components/crm/traffic/TrafficHeatmap.tsx",
      "src/components/crm/traffic/TrafficTimeSeriesChart.tsx",
      "src/components/crm/traffic/ChannelFeesSettingsBlock.tsx",
      "src/components/crm/TrafficManager.tsx",
      "src/app/layout.tsx",
      "src/app/admin/page.tsx",
      "src/components/CommandMenuSpotlight.tsx",
      "src/components/storefront/Storefront.tsx",
      "src/components/storefront/CheckoutModal.tsx",
      "src/context/BiaMakesContext.tsx",
      "src/app/p/[sku]/page.tsx",
      "README.md",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter para a tela antiga de Marketplaces:
1. Restaurar MarketplacesManager.tsx a partir do backup do git.
2. Reverter as referências da aba 'traffic' para 'marketplaces' em src/app/admin/page.tsx e CommandMenuSpotlight.tsx.`
  },
  {
    id: "change-2026-11-12-13",
    timestamp: "2026-11-12T11:36:00-03:00",
    title: "Modal de Checkout Real (PIX / Cartão), Reserva Atômica no Kardex e Gravação de Pedido no CRM",
    description: `1. Função createStorefrontOrder no BiaMakesContext: Gera número de pedido único (#BM-XXXX), insere no topo de orders com status 'PENDENTE', atualiza o estoque reservado (reservedStock) dos produtos/variações, registra movimentação do tipo 'RESERVA' no Kardex e limpa a sacola.
2. Eliminação Total do alert() Nativo: O botão da sacola agora abre o novo CheckoutModal completo e responsivo.
3. Novo CheckoutModal (src/components/storefront/CheckoutModal.tsx):
   - Etapa 1 (Identificação & Envio): Nome, WhatsApp com máscara, CEP inteligente com preenchimento de endereço e complemento.
   - Etapa 2 (Pagamento): Aba PIX com QR Code visual estilizado, código 'PIX Copia e Cola', chave oficial da loja e feedback; e Aba Cartão com simulação limpa em até 3x sem juros.
   - Etapa 3 (Confirmação & WhatsApp): Tela comemorativa de confirmação com código do pedido gravado no CRM e botão 'Enviar Comprovante e Acompanhar no WhatsApp Oficial' com mensagem pré-formatada.
4. Integração na Vitrine Social: Adicionado checkout direto em /p/[sku]/page.tsx permitindo compra imediata com 1 clique.`,
    filesModified: [
      "src/context/BiaMakesContext.tsx",
      "src/components/storefront/CheckoutModal.tsx",
      "src/components/storefront/Storefront.tsx",
      "src/app/p/[sku]/page.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter o modal de checkout e voltar aos alertas simples:
1. Restaurar BiaMakesContext.tsx, Storefront.tsx e /p/[sku]/page.tsx para a versão anterior a partir do Git.`
  },
  {
    id: "change-2026-11-12-12",
    timestamp: "2026-11-12T11:22:00-03:00",
    title: "Site Comercial: Centralização STORE_CONFIG, Validação de Estoque por Tom e Frete Interativo",
    description: `1. Centralização STORE_CONFIG: Criado objeto central em src/lib/data.ts com fallback de process.env.NEXT_PUBLIC_WHATSAPP_NUMBER para número e display de WhatsApp, email oficial, perfil do Instagram, URL exata da loja na Shopee, valor para frete grátis (R$ 149) e horário de atendimento.
2. Substituição de Hardcodes: Eliminados telefones '5511999999999' e links genéricos em Storefront.tsx, Navigation.tsx e /p/[sku]/page.tsx.
3. Blindagem de Estoque por Variação (Tom): No catálogo e na página do produto, o botão 'Comprar' agora desabilita com o texto 'Tom Esgotado' especificamente quando o tom selecionado tem saldo zero. No BiaMakesContext (addToCart e updateCartQuantity), a adição e o incremento no carrinho foram travados no saldo real disponível da variação escolhida.
4. Simulador de Frete com Radio Cards Clicáveis: Em /p/[sku]/page.tsx e no Quick View, os resultados do CEP (PAC, SEDEX e Motoboy Express) agora são cards clicáveis que recalculam dinamicamente o Total com Frete e alimentam a mensagem enviada ao WhatsApp com a modalidade escolhida.`,
    filesModified: [
      "src/lib/data.ts",
      "src/context/BiaMakesContext.tsx",
      "src/components/Navigation.tsx",
      "src/components/storefront/Storefront.tsx",
      "src/app/p/[sku]/page.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter as alterações de contatos, estoque por tom e frete:
1. Restaurar data.ts, BiaMakesContext.tsx, Navigation.tsx, Storefront.tsx e /p/[sku]/page.tsx para suas versões anteriores a partir do Git.`
  },
  {
    id: "change-2026-11-11-11",
    timestamp: "2026-11-11T17:44:00-03:00",
    title: "Correção e Sincronização Real de 'Vendas do Dia' com Pedidos Ativos e DRE no Financeiro",
    description: `1. Eliminação de Fallback Estático: Removidos valores artificiais mockados (R$ 1.840,50 e 14 pedidos) que geravam discrepância contra o Faturamento Bruto real da loja.
2. Cálculo Real e Atômico de Vendas do Dia: Agora 'Vendas do Dia' soma estritamente os pedidos faturados com status ativo (PAGO, SEPARACAO, ENVIADO, CONCLUIDO) criados na data de hoje, apurando valor, contagem e ticket médio real.
3. Alinhamento Completo com o Seletor de Período (Hoje, 7 Dias, Mês Atual, 12 Meses): A seleção do período agora filtra dinamicamente os pedidos faturados e calcula custos reais (CMV dos SKUs, comissões dos canais e despesas operacionais proporcionais), garantindo conformidade entre todos os cards de KPIs.
4. Mix de Canais e Dashboard Sincronizados: O Mix de Canais e o gráfico diário da CrmDashboard agora consomem as vendas reais de hoje e o faturamento por canal real a partir dos pedidos ativos.`,
    filesModified: [
      "src/components/crm/FinancialManager.tsx",
      "src/components/crm/CrmDashboard.tsx",
      "src/lib/data.ts",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter o cálculo de Vendas do Dia:
1. Restaurar o arquivo FinancialManager.tsx anterior onde todayMetrics utilizava o fallback estático.
2. Restaurar CrmDashboard.tsx e data.ts para os valores anteriores.`
  },
  {
    id: "change-2026-11-11-10",
    timestamp: "2026-11-11T17:30:00-03:00",
    title: "Dashboard Executiva Bento Grid: Metas, Esteira de Expedição e Inteligência Comercial",
    description: `1. Header Cockpit + Termômetro de Meta Mensal: Saudação dinâmica por horário com status ao vivo, atalhos rápidos e termômetro visual da Meta Mensal de R$ 60.000,00 com barra de progresso animada, valor restante e projeção inteligente de fechamento do mês.
2. Esteira de Expedição Workflow: 4 cards horizontais em formato de pipeline logístico interativo (Aguardando Pagamento, Em Separação, Prontos para Envio, Concluídos Hoje) com contadores em destaque, badges de status e botão de atalho direto para a Central de Pedidos.
3. Bento Grid Executivo & Gráficos Interativos: Gráfico de barras dos últimos 7 dias com tooltips e receita total, e Card de Valuation do Estoque com valor total em Marsala, volume físico, peças reservadas e taxa de giro saudável.
4. Curva ABC de Produtos + Mix de Canais: Ranking dos 4 produtos mais vendidos com foto, badge top rank (1º ao 4º), categoria, unidades e faturamento real; ao lado, gráfico de barras com distribuição de faturamento por canal (Loja Própria, Mercado Livre, Shopee, etc.) com percentual relativo.
5. Central de Riscos Operacionais: Alertas de Ruptura de Estoque Iminente (com botão de reposição imediata para o Kardex) e Monitor de Conformidade ANVISA / Lotes (validação e rastreabilidade sanitária de cosméticos).`,
    filesModified: [
      "src/components/crm/CrmDashboard.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter a Dashboard Executiva Bento Grid para a versão anterior:
1. Restaurar o arquivo src/components/crm/CrmDashboard.tsx a partir do backup ou histórico do git.
2. O dashboard voltará a exibir os cards simples e as listas duplicadas de pedidos e produtos.`
  },
  {
    id: "change-2026-11-11-9",
    timestamp: "2026-11-11T17:23:00-03:00",
    title: "Calibração Visual e Slider Dinâmico no Modal de Configuração de Marketplaces",
    description: `1. Slider Interativo de Taxa de Comissão: No modal de configuração de canais do MarketplacesManager, foi implementado um controle duplo (slider range de 0% a 30% com visualizador dinâmico de taxa), facilitando o ajuste de comissões por canal (0% Direto a 30% Full) que alimenta o DRE.
2. Refinamento de Conexão: Confirmação e revalidação do Hub de Conectividade com sincronização paralela e terminal developer console em tempo real.`,
    filesModified: [
      "src/components/crm/MarketplacesManager.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter o slider e voltar ao input numérico tradicional:
1. No MarketplacesManager.tsx, substituir o input type='range' por um input type='number' tradicional.`
  },
  {
    id: "change-2026-11-11-8",
    timestamp: "2026-11-11T17:19:00-03:00",
    title: "Transformação da Central de Marketplaces em Hub de Conectividade Multicanal (MarketplacesManager.tsx)",
    description: `1. Painel Global de Sincronização: Banner executivo com 3 indicadores (Canais Conectados, Total de Anúncios Integrados e Status da Fila com latência de 120ms) e botão mestre 'Forçar Sincronização em Lote de Todos os Canais'.
2. Conectores Estilo App Store: Cards repaginados para Mercado Livre, Shopee, Amazon, TikTok Shop, Shein, Magalu e Instagram Shopping com badges dinâmicos de status (CONECTADO em verde, DESCONECTADO em cinza, SINCRONIZANDO em âmbar com pulso), grade com taxa de comissão, frete base e anúncios ativos, além de barra de saúde de última sincronização e botões com spinners.
3. Modal Moderno de Configuração: Ajuste de nome de conta, URL oficial, taxa de comissão contratual (%) com impacto direto no DRE, frete padrão embutido e botão de desconexão/reconexão segura.
4. Laboratório de Idempotência & Webhooks: Explicação amigável sobre proteção contra duplo débito, gerador de IDs de eventos (X-Event-ID), botão de teste interativo e Terminal Developer Console escuro com realce de sintaxe em tempo real.`,
    filesModified: [
      "src/components/crm/MarketplacesManager.tsx",
      "src/app/admin/page.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter o módulo de marketplaces para a versão anterior:
1. Restaurar o arquivo MarketplacesManager.tsx anterior com os cartões antigos e o log de texto cru.
2. Remover o botão de sincronização em lote e o novo Developer Console.`
  },
  {
    id: "change-2026-11-11-7",
    timestamp: "2026-11-11T17:12:00-03:00",
    title: "Transformação do Módulo de Estoque & Almoxarifado com Kardex Auditável (StockManager.tsx)",
    description: `1. Hero Banner de Saúde do Inventário: 3 cards executivos no topo (Valor Total em Reais a Preço de Custo, Volume Físico no Armazém com divisão físico/reservado/disponível, e Nível de Alerta/Ruptura com contagem de produtos críticos).
2. Duas Abas Principais: Aba 1 'Posição Atual do Catálogo (Armazém)' e Aba 2 'Auditoria & Histórico de Movimentações (Kardex)'.
3. Régua de Capacidade Visual de Estoque (Aba 1): Barra proporcional indicando saldo físico, reservado e estoque mínimo de segurança com marcador vertical, badge pulsante 'Comprar / Repor', e Accordion expansível para visualização de estoque por tonalidade/variação individual.
4. Kardex com Trilha de Auditoria (Aba 2): Filtros por tipo de movimentação (+ Entrada, - Saída, ↺ Devolução, ⚙ Ajuste), busca por termo, indicação de evolução de saldo (Anterior -> Movimentado -> Saldo Atual), operador responsável e exportação em CSV com 1 clique.
5. Modal de Movimentação Seguro & Intuitivo: Botões visuais grandes (+ Entrada, - Baixa, ⚙ Balanço), seletor obrigatório de variação/tom quando existente, operador capturado automaticamente do contexto autenticado, tags rápidas de motivos documentados e cálculo prévio em tempo real com barreira contra violação do estoque reservado.`,
    filesModified: [
      "src/components/crm/StockManager.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter o módulo de estoque para o layout anterior:
1. Restaurar o arquivo StockManager.tsx anterior com a listagem vertical simples.
2. Remover a estrutura de abas 'inventory' e 'kardex', o Accordion e a exportação CSV do Kardex.`
  },
  {
    id: "change-2026-11-11-6",
    timestamp: "2026-11-11T17:08:00-03:00",
    title: "Repaginação da Central de Pedidos & Expedição Multicanal (OrdersManager.tsx)",
    description: `1. Esteira de Status Counters: 5 cards interativos no topo (Todos, Aguardando/Pagos, Em Separação, Enviados/Concluídos e Devoluções/Cancelados) permitindo filtrar instantaneamente em um clique.
2. Barra de Filtros & Atalho '/': Campo de busca com foco rápido na tecla '/', pílulas coloridas para canais oficiais (Site, Instagram, Mercado Livre, Shopee, WhatsApp) e seletor rápido de períodos (Tudo, Hoje, 7 Dias, 30 Dias).
3. Visual Row-Cards: Cada pedido é um cartão elegante com badge do canal, data/hora relativa, miniatura do produto principal com tons e quantidades, link direto do WhatsApp do cliente com mensagem pronta de status, e valor formatado com selo de estorno se aplicável.
4. Modal Executivo de Expedição (Romaneio): Timeline visual das etapas (Criado -> Pago -> Separação -> Enviado -> Entregue), cópia de endereço de entrega com 1 clique, código de rastreamento com cópia rápida, breakdown contábil e botão de impressão de Ficha de Separação.
5. Modal de Estorno Transparente & Empty State: Feedback visual educativo informando quantidade de produtos devolvidos ao estoque e valor abatido do DRE.`,
    filesModified: [
      "src/components/crm/OrdersManager.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter a central de pedidos para o formato de tabela tradicional anterior:
1. Restaurar o arquivo OrdersManager.tsx com a tag <table> simples.
2. Remover o atalho de teclado '/', os Status Counters e as ações de WhatsApp Web.`
  },
  {
    id: "change-2026-11-11-5",
    timestamp: "2026-11-11T17:02:00-03:00",
    title: "Repaginação Visual Executiva do Módulo Financeiro & DRE (FinancialManager.tsx)",
    description: `1. Cabeçalho Executivo & Controles: Título sofisticado, Seletor de Período Global em formato de pílulas ('Hoje', '7 Dias', 'Mês Atual' e '12 Meses') e botão de Exportação de Relatório (CSV).
2. Faixa Superior de 4 Hero Cards: Faturamento Bruto (com crescimento e estornos), Custos Totais Deduzidos (% do faturamento), Lucro Líquido Real (com margem % em destaque) e Vendas do Dia (Ao Vivo) com badge pulsante.
3. DRE Visual em Cachoeira (Waterfall): Régua progressiva horizontal didática mostrando os 5 passos do caminho do dinheiro (Receita -> Comissões -> CMV -> Despesas Fixas -> Lucro Líquido Retido) acompanhada de barra proporcional segmentada de cada real faturado.
4. Navegação por Abas Internas:
   - Aba A: 'Visão Geral & Mix de Canais' com gráfico vertical dos últimos meses, barras de progresso horizontais dos canais e tabela de rentabilidade por canal.
   - Aba B: 'DRE Contábil Detalhado' com estrutura contábil zebrada e destacada.
   - Aba C: 'Histórico de 12 Meses & Transações' com consolidação anual e lista das últimas transações.
5. Paleta Oficial & UX: Marsala (#7A3F51/#9C5B6F), Nude (#FAF7F8/#E9D9CD), Rosé Gold (#C69A76) e Esmeralda (#059669/#10B981) com animações suaves e total responsividade.`,
    filesModified: [
      "src/components/crm/FinancialManager.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter o layout financeiro para a versão anterior:
1. Restaurar o arquivo FinancialManager.tsx anterior com o gráfico de pizza SVG e rolagem vertical contínua.
2. Remover a estrutura de abas 'overview', 'dre' e 'history'.`
  },
  {
    id: "change-2026-11-11-4",
    timestamp: "2026-11-11T16:55:00-03:00",
    title: "Governança de Estoque: Trava de Saldo Físico, Kardex Justificado, Variações Atômicas e Proteção de Reserva",
    description: `1. Trava de Edição Direta de Estoque: O campo 'Estoque Físico Central' e o estoque de variações na edição de produtos foram bloqueados contra edição manual solta no ProductsManager.tsx e no BiaMakesContext.tsx. Todo ajuste de saldo agora exige obrigatoriamente lançamento auditado no Kardex (StockManager) com motivo, operador e tipo (ENTRADA, SAIDA, AJUSTE ou DEVOLUCAO).
2. Integridade Central x Variações: Para produtos com variações (ex: tons de base/batom), o estoque físico central é estritamente a soma dos estoques das variações (physicalStock = sum(variations.stock)).
3. Movimentação Atômica por Variação: No StockManager, adicionado seletor específico de variação/tom ao lançar movimentações, atualizando de forma atômica o saldo da variação selecionada e o estoque central consolidado.
4. Bloqueio de Estoque Abaixo da Reserva: Implementada barreira de segurança que impede qualquer movimentação (saída/ajuste) que resulte em estoque físico inferior ao estoque reservado (reservedStock) do produto, preservando pedidos já comprometidos.`,
    filesModified: [
      "src/context/BiaMakesContext.tsx",
      "src/components/crm/ProductsManager.tsx",
      "src/components/crm/StockManager.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter estas regras de estoque para o estado anterior:
1. No ProductsManager.tsx, remover a propriedade 'disabled={Boolean(editingProduct)}' dos inputs de estoque.
2. No BiaMakesContext.tsx, reverter updateProductStock para aceitar apenas (productId, newPhysical) e remover a soma de variações no addProduct/updateProduct.
3. No StockManager.tsx, remover a verificação de reservedStock e o seletor de variação no modal.`
  },
  {
    id: "change-2026-11-11-3",
    timestamp: "2026-11-11T16:48:00-03:00",
    title: "Validações E-commerce no Cadastro de Produtos (SKU, EAN-13, Preços e State Mutability)",
    description: `1. Validação de Unicidade de SKU: Bloqueio contra duplicidade no SKU principal e nos SKUs de variações/tons, comparando com todo o catálogo existente e internamente no formulário antes de salvar.
2. EAN-13 Oficial com GTIN Checksum: Implementado cálculo e validação do dígito verificador (módulo 10) do EAN-13 brasileiro (prefixo 789). Adicionado botão 'Gerar Válido' e feedback visual em tempo real no formulário.
3. Validação de Preços e Margens: Exigência de Preço de Venda > 0. Se houver Preço Promocional, validação estrita de que 0 < Preço Promo < Preço de Venda. Alerta visual e confirmação de segurança caso o preço efetivo gere margem negativa (prejuízo por unidade vendida).
4. Correção de Mutação de Estado: Substituição da mutação direta em formVariations por atualizações imutáveis com deep copy (.map() com novo objeto) ao editar cor, nome, SKU e estoque de variações, eliminando bugs de estado no React context.`,
    filesModified: [
      "src/components/crm/ProductsManager.tsx",
      "src/lib/utils.ts",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter estas validações para o estado anterior:
1. No ProductsManager.tsx, remover as checagens de seenInternalSkus e isValidEan13 no handleSave.
2. Em src/lib/utils.ts, remover as funções calculateEan13Checksum, isValidEan13 e generateValidEan13.
3. Restaurar as linhas de mutação direta 'updated[i].colorHex = e.target.value'.`
  },
  {
    id: "change-2026-11-11-2",
    timestamp: "2026-11-11T16:35:00-03:00",
    title: "Posicionamento do Alerta de Alteração na Barra Superior ao lado da Lupa",
    description: `1. Integração do alerta flutuante com a barra de navegação superior (ao lado da Lupa/Spotlight).
2. Ao clicar em 'Ciente / Fechar', o card flutuante do canto inferior some automaticamente e um botão dedicado de histórico de alterações com badge animado permanece ativo no topo ao lado da Lupa, permitindo ao usuário eduardo.nunes reabrir os detalhes a qualquer momento.`,
    filesModified: [
      "src/components/Navigation.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter o botão ao lado da lupa e manter apenas o toast flutuante no canto:
1. Remover o botão de histórico ao lado da lupa em src/components/Navigation.tsx.
2. Limpar a chave de localStorage 'biamakes_ack_changes'.`
  },
  {
    id: "change-2026-11-11-1",
    timestamp: "2026-11-11T16:30:00-03:00",
    title: "Refatoração do ERP Financeiro, DRE e Rastreabilidade de Canais",
    description: `1. Refatoração do cálculo de 'financial' no BiaMakesContext para somar os pedidos ativos (PAGO, SEPARACAO, ENVIADO, CONCLUIDO), calculando CMV por SKU real dos produtos e deduzindo as comissões por canal usando a taxa real cadastrada (feePercentage) de cada canal em vez da taxa fixa de 14%.
2. Permissão de resultado líquido real no DRE sem clamping artificial em zero (exibindo lucro real ou prejuízo operacional real).
3. Conexão da simulação de sincronização no MarketplacesManager ao registro de rastreabilidade e histórico dos canais.
4. Criação do sistema de notificação exclusivo para o usuário eduardo.nunes com painel de visualização das alterações e histórico de reversão.`,
    filesModified: [
      "src/context/BiaMakesContext.tsx",
      "src/components/crm/FinancialManager.tsx",
      "src/components/crm/OrdersManager.tsx",
      "src/components/crm/MarketplacesManager.tsx",
      "src/components/ChangeNotificationModal.tsx",
      "HISTORICO_ALTERACOES.txt"
    ],
    reversalGuide: `Para reverter estas alterações para o estado anterior:
1. No BiaMakesContext.tsx, restaurar o useMemo de 'financial' que subtraía valores do objeto initialFinancial estático com clamp Math.max(0, ...).
2. Restaurar a taxa de comissão hardcoded em 0.14 (14%) em vez de consultar channel.feePercentage.
3. No MarketplacesManager.tsx, desacoplar os logs de sincronização do histórico do canal.
Consulte HISTORICO_ALTERACOES.txt para instruções detalhadas.`
  }
];

const ACKNOWLEDGED_STORAGE_KEY = "biamakes_ack_changes_v1";

export function ChangeNotificationModal() {
  const { adminUser, isAdminAuthenticated } = useBiaMakes();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<SystemChangeLogItem | null>(null);
  const [isAcknowledged, setIsAcknowledged] = useState(true);

  // Apenas renderiza e notifica para o usuário eduardo.nunes
  const isTargetUser = isAdminAuthenticated && adminUser?.username === "eduardo.nunes";
  const latestChange = SYSTEM_CHANGE_LOGS[0];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ackId = localStorage.getItem(ACKNOWLEDGED_STORAGE_KEY);
      // Se já deu ciente para a alteração mais recente, não exibe o toast flutuante
      if (ackId === latestChange.id) {
        setIsAcknowledged(true);
      } else {
        setIsAcknowledged(false);
      }
    }
  }, [latestChange.id]);

  useEffect(() => {
    if (isTargetUser && SYSTEM_CHANGE_LOGS.length > 0) {
      setSelectedChange(SYSTEM_CHANGE_LOGS[0]);
    }

    // Listener para quando o usuário clicar no ícone ao lado da lupa na Navigation
    const handleOpenModal = (e: Event) => {
      const customEv = e as CustomEvent<string | undefined>;
      const targetId = customEv.detail;
      const found = targetId ? SYSTEM_CHANGE_LOGS.find(c => c.id === targetId) : SYSTEM_CHANGE_LOGS[0];
      setSelectedChange(found || SYSTEM_CHANGE_LOGS[0]);
      setIsOpen(true);
    };

    window.addEventListener("biamakes-open-change-log", handleOpenModal);
    return () => {
      window.removeEventListener("biamakes-open-change-log", handleOpenModal);
    };
  }, [isTargetUser]);

  const handleAcknowledge = () => {
    // Marca como ciente no localStorage para não reabrir o popup flutuante
    localStorage.setItem(ACKNOWLEDGED_STORAGE_KEY, latestChange.id);
    setIsAcknowledged(true);
    setIsOpen(false);
    // Notifica outros componentes como a barra superior
    window.dispatchEvent(new CustomEvent("biamakes-change-acknowledged", { detail: latestChange.id }));
  };

  if (!isTargetUser) {
    return null;
  }

  return (
    <>
      {/* Toast flutuante (Só aparece se o usuário AINDA NÃO tiver ficado ciente) */}
      {!isAcknowledged && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#7A3F51] text-white p-3.5 pr-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 max-w-md backdrop-blur-md">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 text-white shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#7A3F51]" />
            </div>
            <div className="text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>Alteração do Sistema Notificada</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">eduardo.nunes</span>
              </div>
              <p className="text-white/80 line-clamp-1 text-[11px] mt-0.5">
                {latestChange.title}
              </p>
            </div>
            <div className="flex items-center gap-1 ml-auto shrink-0">
              <button
                onClick={() => {
                  setSelectedChange(latestChange);
                  setIsOpen(true);
                }}
                className="px-3 py-1.5 bg-white text-[#7A3F51] rounded-xl font-bold text-xs hover:bg-[#FAF0F4] transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Alteração</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleAcknowledge}
                title="Ficar ciente e mover para barra superior"
                className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalhado de auditoria e informações da alteração */}
      {isOpen && selectedChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 relative shadow-2xl border border-[#E9D9CD] max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E9D9CD]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF0F4] text-[#7A3F51] flex items-center justify-center border border-[#E9D9CD]">
                  <FileText className="w-5 h-5 text-[#9C5B6F]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Alteração Registrada
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      ID: {selectedChange.id}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#39313A] mt-1">
                    {selectedChange.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Alterações caso haja mais de uma */}
            {SYSTEM_CHANGE_LOGS.length > 1 && (
              <div className="flex items-center gap-2 pt-3 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Histórico:</span>
                {SYSTEM_CHANGE_LOGS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedChange(item)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      selectedChange.id === item.id
                        ? "bg-[#7A3F51] text-white shadow-sm"
                        : "bg-[#FAF7F8] text-gray-600 border border-[#E9D9CD] hover:bg-white"
                    }`}
                  >
                    {item.id}
                  </button>
                ))}
              </div>
            )}

            {/* Body */}
            <div className="space-y-4 pt-4 text-xs">
              
              {/* Data & Horário */}
              <div className="flex items-center gap-2 p-3 bg-[#FAF7F8] rounded-xl border border-[#E9D9CD] text-gray-700">
                <Clock className="w-4 h-4 text-[#9C5B6F]" />
                <span><strong>Data e Horário:</strong> {formatDate(selectedChange.timestamp)} (Horário de Brasília)</span>
              </div>

              {/* Descrição detalhada */}
              <div>
                <h4 className="font-bold text-[#39313A] mb-1.5 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  O que foi alterado
                </h4>
                <div className="p-3.5 bg-white rounded-xl border border-[#E9D9CD] text-gray-700 whitespace-pre-line leading-relaxed font-sans">
                  {selectedChange.description}
                </div>
              </div>

              {/* Arquivos Modificados */}
              <div>
                <h4 className="font-bold text-[#39313A] mb-1.5 uppercase text-[11px] tracking-wider">
                  Arquivos Impactados
                </h4>
                <div className="p-3 bg-[#FAF7F8] rounded-xl border border-[#E9D9CD] space-y-1 font-mono text-[11px] text-[#7A3F51]">
                  {selectedChange.filesModified.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9C5B6F]" />
                      <span>{file}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Como reverter */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  Possibilidade de Reversão / Voltar Função
                </div>
                <div className="text-[11px] text-amber-800 whitespace-pre-line leading-relaxed">
                  {selectedChange.reversalGuide}
                </div>
                <div className="text-[10px] text-amber-700/80 pt-1 font-medium">
                  Arquivo de rastreio permanente gravado em: <strong className="font-mono">HISTORICO_ALTERACOES.txt</strong>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-[#E9D9CD]">
              <span className="text-[11px] text-gray-500">
                Acesso permanente fixado ao lado da lupa no cabeçalho
              </span>
              <button
                onClick={handleAcknowledge}
                className="px-5 py-2.5 rounded-full bg-[#7A3F51] hover:bg-[#5E303E] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Ciente / Salvar e Fechar</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
