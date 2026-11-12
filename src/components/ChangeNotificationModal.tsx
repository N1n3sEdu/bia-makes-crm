"use client";

import React, { useState, useEffect } from "react";
import { useBiaMakes } from "@/context/BiaMakesContext";
import { Bell, Info, X, Clock, FileText, CheckCircle, ChevronRight, RotateCcw, Sparkles } from "lucide-react";
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
