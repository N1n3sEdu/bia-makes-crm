import { 
  Product, 
  StockMovement, 
  Order, 
  MarketplaceChannel, 
  Customer, 
  FinancialMetric, 
  SystemUser 
} from "@/types";

export const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Base Líquida Velvet Matte HD — Bia Makes",
    sku: "BM-BASE-01",
    ean: "7891234567011",
    category: "Rosto",
    brand: "Bia Makes",
    costPrice: 28.50,
    salePrice: 79.90,
    promoPrice: 69.90,
    physicalStock: 85,
    reservedStock: 12,
    minStock: 25,
    shippingValue: 12.90,
    freeShipping: false,
    batch: "LT2026-A1",
    expiryDate: "2027-08-30",
    description: "Base fluida de alta cobertura e toque aveludado com Ácido Hialurônico e Niacinamida. Resistente à água e ao suor com acabamento natural e duração de até 24 horas.",
    images: [
      "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
    ],
    variations: [
      { id: "v1", name: "Tom 01 — Porcelana Clara", colorHex: "#F6E6DA", sku: "BM-BASE-01-T01", stock: 20 },
      { id: "v2", name: "Tom 02 — Bege Nude", colorHex: "#EED7C5", sku: "BM-BASE-01-T02", stock: 25 },
      { id: "v3", name: "Tom 03 — Mel Dourado", colorHex: "#D8B495", sku: "BM-BASE-01-T03", stock: 22 },
      { id: "v4", name: "Tom 04 — Canela Quente", colorHex: "#B78A69", sku: "BM-BASE-01-T04", stock: 18 },
    ],
    socialLinks: {
      instagramUrl: "https://instagram.com/biamakeoficial_",
      shopeeUrl: "https://shopee.com.br/biamakes.beauty",
      mercadoLivreUrl: "https://mercadolivre.com.br",
      tiktokUrl: "https://tiktok.com/@biamakeoficial_",
      embedStockAndShipping: true,
    },
    rating: 4.9,
    reviewsCount: 142,
    isFeatured: true,
    tags: ["Cruelty-Free", "Vegano", "Ácido Hialurônico"]
  },
  {
    id: "prod-2",
    name: "Batom Líquido Matte Rosé Gold — Efeito Conforto",
    sku: "BM-BATOM-02",
    ean: "7891234567028",
    category: "Lábios",
    brand: "Bia Makes",
    costPrice: 12.00,
    salePrice: 42.90,
    promoPrice: 38.90,
    physicalStock: 120,
    reservedStock: 15,
    minStock: 30,
    shippingValue: 9.90,
    freeShipping: false,
    batch: "LT2026-B4",
    expiryDate: "2027-11-15",
    description: "Fórmula cremosa ultra pigmentada que seca matte sem craquelar. Enriquecido com Manteiga de Karité e Vitamina E para hidratação prolongada dos lábios.",
    images: [
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=800&auto=format&fit=crop&q=80"
    ],
    variations: [
      { id: "v5", name: "Rosé Elegance", colorHex: "#C97A8B", sku: "BM-BAT-02-RE", stock: 35 },
      { id: "v6", name: "Nude Sofisticado", colorHex: "#B8867D", sku: "BM-BAT-02-NS", stock: 40 },
      { id: "v7", name: "Marsala Chic", colorHex: "#7E3E4B", sku: "BM-BAT-02-MC", stock: 45 },
    ],
    socialLinks: {
      instagramUrl: "https://instagram.com/biamakeoficial_",
      shopeeUrl: "https://shopee.com.br/biamakes.beauty",
      mercadoLivreUrl: "https://mercadolivre.com.br",
      tiktokUrl: "https://tiktok.com/@biamakeoficial_",
      embedStockAndShipping: true,
    },
    rating: 4.8,
    reviewsCount: 98,
    isFeatured: true,
    tags: ["Longa Duração", "Não Transfere", "Vitamina E"]
  },
  {
    id: "prod-3",
    name: "Paleta de Sombras Nude Glamour 18 Cores",
    sku: "BM-PALET-03",
    ean: "7891234567035",
    category: "Olhos",
    brand: "Bia Makes",
    costPrice: 39.00,
    salePrice: 119.90,
    promoPrice: 99.90,
    physicalStock: 48,
    reservedStock: 8,
    minStock: 15,
    shippingValue: 0,
    freeShipping: true,
    batch: "LT2025-C9",
    expiryDate: "2027-04-10",
    description: "18 tonalidades em acabamentos matte aveludado, cintilante acetinado e glitter flocado prensado. Pigmentação intensa de fácil esfumado para makes diurnas e glamourosas.",
    images: [
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503236823255-94609f598e71?w=800&auto=format&fit=crop&q=80"
    ],
    variations: [
      { id: "v8", name: "Edição Rosé Gold Glamour", colorHex: "#D4AF37", sku: "BM-PAL-03-RG", stock: 48 }
    ],
    socialLinks: {
      instagramUrl: "https://instagram.com/biamakeoficial_",
      shopeeUrl: "https://shopee.com.br/biamakes.beauty",
      mercadoLivreUrl: "https://mercadolivre.com.br",
      tiktokUrl: "https://tiktok.com/@biamakeoficial_",
      embedStockAndShipping: true,
    },
    rating: 5.0,
    reviewsCount: 215,
    isFeatured: true,
    tags: ["Alta Pigmentação", "Glitter Prensado"]
  },
  {
    id: "prod-4",
    name: "Kit 12 Pincéis Profissionais Master Gold com Estojo",
    sku: "BM-PINCEL-04",
    ean: "7891234567042",
    category: "Pincéis & Acessórios",
    brand: "Bia Makes",
    costPrice: 45.00,
    salePrice: 139.90,
    promoPrice: 119.00,
    physicalStock: 32,
    reservedStock: 5,
    minStock: 12,
    shippingValue: 0,
    freeShipping: true,
    batch: "LT2026-D1",
    expiryDate: "2030-01-01",
    description: "Cerdas sintéticas ultrafinas com toque de seda. Cabo em madeira nobre laqueada em rosa champanhe com ferrolho em alumínio dourado. Acompanha clutch estojo luxo.",
    images: [
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80"
    ],
    variations: [
      { id: "v9", name: "Estojo Rosé Champagne", colorHex: "#E9D9CD", sku: "BM-PIN-04-RC", stock: 32 }
    ],
    socialLinks: {
      instagramUrl: "https://instagram.com/biamakeoficial_",
      shopeeUrl: "https://shopee.com.br/biamakes.beauty",
      mercadoLivreUrl: "https://mercadolivre.com.br",
      embedStockAndShipping: true,
    },
    rating: 4.9,
    reviewsCount: 88,
    isFeatured: false,
    tags: ["Cerdas Sintéticas Premium", "Cruelty-Free"]
  },
  {
    id: "prod-5",
    name: "Sérum Facial Iluminador Glow Rosehip & Vitamina C",
    sku: "BM-SERUM-05",
    ean: "7891234567059",
    category: "Skincare",
    brand: "Bia Makes",
    costPrice: 22.00,
    salePrice: 68.90,
    promoPrice: 59.90,
    physicalStock: 14, // Estoque baixo para teste de alerta
    reservedStock: 3,
    minStock: 20,
    shippingValue: 14.50,
    freeShipping: false,
    batch: "LT2025-E8",
    expiryDate: "2026-12-20", // Vencimento próximo (menos de 60 dias) para alerta ANVISA
    description: "Potencializador de radiância e primer iluminador pré-maquiagem. Uniformiza a textura da pele e proporciona aquele viço de pele descansada e luminosa.",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80"
    ],
    variations: [
      { id: "v10", name: "Frasco 30ml Conta-gotas", colorHex: "#F5DDE5", sku: "BM-SER-05-30ML", stock: 14 }
    ],
    socialLinks: {
      instagramUrl: "https://instagram.com/biamakeoficial_",
      shopeeUrl: "https://shopee.com.br/biamakes.beauty",
      tiktokUrl: "https://tiktok.com/@biamakeoficial_",
      embedStockAndShipping: true,
    },
    rating: 4.7,
    reviewsCount: 76,
    isFeatured: true,
    tags: ["Dermatologicamente Testado", "Vitamina C Estabilizada"]
  },
  {
    id: "prod-6",
    name: "Pó Translúcido Ultrafino HD Efeito Blur",
    sku: "BM-PO-06",
    ean: "7891234567066",
    category: "Rosto",
    brand: "Bia Makes",
    costPrice: 16.50,
    salePrice: 54.90,
    promoPrice: 49.90,
    physicalStock: 65,
    reservedStock: 10,
    minStock: 20,
    shippingValue: 11.90,
    freeShipping: false,
    batch: "LT2026-F2",
    expiryDate: "2028-02-15",
    description: "Textura micronizada que sela a maquiagem sem adicionar peso ou marcar linhas de expressão. Não estoura no flash de fotografias.",
    images: [
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80"
    ],
    variations: [
      { id: "v11", name: "Incolor Translúcido Universal", colorHex: "#FFFFFF", sku: "BM-PO-06-INC", stock: 35 },
      { id: "v12", name: "Banana Powder Suave", colorHex: "#FBE7B5", sku: "BM-PO-06-BAN", stock: 30 }
    ],
    socialLinks: {
      instagramUrl: "https://instagram.com/biamakeoficial_",
      shopeeUrl: "https://shopee.com.br/biamakes.beauty",
      mercadoLivreUrl: "https://mercadolivre.com.br",
      embedStockAndShipping: true,
    },
    rating: 4.8,
    reviewsCount: 112,
    isFeatured: false,
    tags: ["Não Estoura no Flash", "Controle de Oleosidade"]
  }
];

export const initialStockMovements: StockMovement[] = [
  {
    id: "mov-1",
    productId: "prod-1",
    productName: "Base Líquida Velvet Matte HD — Bia Makes",
    sku: "BM-BASE-01",
    type: "ENTRADA",
    quantity: 100,
    previousStock: 0,
    currentStock: 100,
    reason: "Entrada por Nota Fiscal de Compra NF-e 4920",
    operator: "Bia Teixeira (Admin)",
    date: "2026-11-01T10:00:00Z"
  },
  {
    id: "mov-2",
    productId: "prod-1",
    productName: "Base Líquida Velvet Matte HD — Bia Makes",
    sku: "BM-BASE-01",
    type: "SAIDA",
    quantity: 15,
    previousStock: 100,
    currentStock: 85,
    reason: "Baixa automática - Pedidos Mercado Livre e Shopee",
    operator: "Sincronizador Automático Celery",
    date: "2026-11-08T14:30:00Z"
  },
  {
    id: "mov-3",
    productId: "prod-5",
    productName: "Sérum Facial Iluminador Glow Rosehip & Vitamina C",
    sku: "BM-SERUM-05",
    type: "AJUSTE",
    quantity: -6,
    previousStock: 20,
    currentStock: 14,
    reason: "Ajuste de inventário por auditoria física",
    operator: "Carla Martins (Estoque)",
    date: "2026-11-09T09:15:00Z"
  },
  {
    id: "mov-4",
    productId: "prod-3",
    productName: "Paleta de Sombras Nude Glamour 18 Cores",
    sku: "BM-PALET-03",
    type: "ENTRADA",
    quantity: 50,
    previousStock: 0,
    currentStock: 50,
    reason: "Reposição de Lote Fornecedor LabCosmetics",
    operator: "Bia Teixeira (Admin)",
    date: "2026-11-05T16:45:00Z"
  }
];

export const initialOrders: Order[] = [
  {
    id: "ord-1001",
    orderNumber: "BM-2026-1001",
    channel: "MERCADO_LIVRE",
    customerName: "Camila Guimarães",
    customerEmail: "camila.g@gmail.com",
    customerPhone: "(11) 98765-4321",
    items: [
      {
        productId: "prod-1",
        productName: "Base Líquida Velvet Matte HD",
        sku: "BM-BASE-01-T02",
        variationName: "Tom 02 — Bege Nude",
        quantity: 1,
        price: 79.90
      },
      {
        productId: "prod-2",
        productName: "Batom Líquido Matte Rosé Gold",
        sku: "BM-BAT-02-RE",
        variationName: "Rosé Elegance",
        quantity: 1,
        price: 38.90
      }
    ],
    totalAmount: 118.80,
    shippingAmount: 12.90,
    status: "SEPARACAO",
    paymentMethod: "Mercado Pago (Cartão)",
    shippingAddress: "Rua Oscar Freire, 1200 - Jardins, São Paulo/SP",
    trackingCode: "MLBR9920182BR",
    createdAt: "2026-11-10T09:15:00Z"
  },
  {
    id: "ord-1002",
    orderNumber: "BM-2026-1002",
    channel: "SHOPEE",
    customerName: "Juliana Andrade",
    customerEmail: "ju.andrade@outlook.com",
    customerPhone: "(21) 99123-5566",
    items: [
      {
        productId: "prod-3",
        productName: "Paleta de Sombras Nude Glamour",
        sku: "BM-PAL-03-RG",
        variationName: "Edição Rosé Gold Glamour",
        quantity: 1,
        price: 99.90
      }
    ],
    totalAmount: 99.90,
    shippingAmount: 0,
    status: "ENVIADO",
    paymentMethod: "ShopeePay (PIX)",
    shippingAddress: "Av. Atlântica, 450 - Copacabana, Rio de Janeiro/RJ",
    trackingCode: "SHP77281920BR",
    createdAt: "2026-11-09T18:30:00Z"
  },
  {
    id: "ord-1003",
    orderNumber: "BM-2026-1003",
    channel: "SITE",
    customerName: "Mariana Souza",
    customerEmail: "mari.souza@yahoo.com.br",
    customerPhone: "(31) 98455-1122",
    items: [
      {
        productId: "prod-4",
        productName: "Kit 12 Pincéis Profissionais Master Gold",
        sku: "BM-PIN-04-RC",
        variationName: "Estojo Rosé Champagne",
        quantity: 1,
        price: 119.00
      },
      {
        productId: "prod-5",
        productName: "Sérum Facial Iluminador Glow",
        sku: "BM-SER-05-30ML",
        variationName: "Frasco 30ml",
        quantity: 1,
        price: 59.90
      }
    ],
    totalAmount: 178.90,
    shippingAmount: 0,
    status: "PAGO",
    paymentMethod: "PIX Direto (Site Bia Makes)",
    shippingAddress: "Rua da Bahia, 1850 - Lourdes, Belo Horizonte/MG",
    createdAt: "2026-11-10T11:40:00Z"
  },
  {
    id: "ord-1004",
    orderNumber: "BM-2026-1004",
    channel: "TIKTOK",
    customerName: "Beatriz Nogueira",
    customerEmail: "bia.nogueira@gmail.com",
    customerPhone: "(41) 97788-9900",
    items: [
      {
        productId: "prod-2",
        productName: "Batom Líquido Matte Rosé Gold",
        sku: "BM-BAT-02-MC",
        variationName: "Marsala Chic",
        quantity: 2,
        price: 38.90
      }
    ],
    totalAmount: 77.80,
    shippingAmount: 9.90,
    status: "CONCLUIDO",
    paymentMethod: "TikTok Shop Pay",
    shippingAddress: "Rua XV de Novembro, 890 - Centro, Curitiba/PR",
    trackingCode: "TTK4481029BR",
    createdAt: "2026-11-07T14:20:00Z"
  },
  {
    id: "ord-1005",
    orderNumber: "BM-2026-1005",
    channel: "INSTAGRAM",
    customerName: "Larissa Manoela Ramos",
    customerEmail: "larissa.ramos@gmail.com",
    customerPhone: "(11) 99887-1122",
    items: [
      {
        productId: "prod-1",
        productName: "Base Líquida Velvet Matte HD",
        sku: "BM-BASE-01-T01",
        variationName: "Tom 01 — Porcelana Clara",
        quantity: 1,
        price: 79.90
      },
      {
        productId: "prod-6",
        productName: "Pó Translúcido Ultrafino HD Efeito Blur",
        sku: "BM-PO-06-INC",
        variationName: "Incolor Translúcido Universal",
        quantity: 1,
        price: 49.90
      }
    ],
    totalAmount: 129.80,
    shippingAmount: 0,
    status: "PAGO",
    paymentMethod: "Instagram Direct / PIX",
    shippingAddress: "Alameda Santos, 1400 - Cerqueira César, São Paulo/SP",
    trackingCode: "IGBR8892102BR",
    createdAt: "2026-11-10T14:15:00Z"
  },
  {
    id: "ord-1006",
    orderNumber: "BM-2026-1006",
    channel: "FACEBOOK",
    customerName: "Fernanda Costa",
    customerEmail: "fer.costa@hotmail.com",
    customerPhone: "(21) 98877-3344",
    items: [
      {
        productId: "prod-3",
        productName: "Paleta de Sombras Nude Glamour",
        sku: "BM-PAL-03-RG",
        variationName: "Edição Rosé Gold Glamour",
        quantity: 1,
        price: 99.90
      }
    ],
    totalAmount: 99.90,
    shippingAmount: 11.90,
    status: "SEPARACAO",
    paymentMethod: "Facebook Marketplace / Cartão",
    shippingAddress: "Rua Barata Ribeiro, 300 - Copacabana, Rio de Janeiro/RJ",
    createdAt: "2026-11-10T12:05:00Z"
  },
  {
    id: "ord-1007",
    orderNumber: "BM-2026-1007",
    channel: "WHATSAPP",
    customerName: "Patrícia Silveira",
    customerEmail: "patricia.silveira@gmail.com",
    customerPhone: "(19) 99122-8899",
    items: [
      {
        productId: "prod-5",
        productName: "Sérum Facial Iluminador Glow",
        sku: "BM-SER-05-30ML",
        variationName: "Frasco 30ml",
        quantity: 2,
        price: 59.90
      }
    ],
    totalAmount: 119.80,
    shippingAmount: 0,
    status: "PAGO",
    paymentMethod: "WhatsApp Pay / PIX",
    shippingAddress: "Av. Brasil, 750 - Jardim Brasil, Campinas/SP",
    createdAt: "2026-11-10T13:45:00Z"
  }
];

export const initialChannels: MarketplaceChannel[] = [
  {
    id: "chan-site",
    code: "SITE",
    name: "Loja Virtual Oficial (Site)",
    status: "CONECTADO",
    accountName: "Bia Makes E-commerce",
    storeUrl: "https://biamakes.com.br",
    activeAds: 36,
    feePercentage: 0.99,
    defaultShippingValue: 0.00,
    lastSync: "2026-11-10T14:45:00Z",
    color: "#7A3F51"
  },
  {
    id: "chan-insta",
    code: "INSTAGRAM",
    name: "Instagram Shopping & Direct",
    status: "CONECTADO",
    accountName: "@biamakeoficial_",
    storeUrl: "https://instagram.com/biamakeoficial_",
    activeAds: 28,
    feePercentage: 2.5,
    defaultShippingValue: 9.90,
    lastSync: "2026-11-10T14:30:00Z",
    color: "#E1306C"
  },
  {
    id: "chan-fb",
    code: "FACEBOOK",
    name: "Facebook Loja / Meta",
    status: "CONECTADO",
    accountName: "Bia Makes Beauty",
    storeUrl: "https://facebook.com/biamakes",
    activeAds: 15,
    feePercentage: 2.5,
    defaultShippingValue: 11.90,
    lastSync: "2026-11-10T14:00:00Z",
    color: "#1877F2"
  },
  {
    id: "chan-wpp",
    code: "WHATSAPP",
    name: "WhatsApp Vendas VIP",
    status: "CONECTADO",
    accountName: "+55 11 98765-4321",
    storeUrl: "https://wa.me/5511987654321",
    activeAds: 20,
    feePercentage: 0.99,
    defaultShippingValue: 0.00,
    lastSync: "2026-11-10T14:50:00Z",
    color: "#25D366"
  },
  {
    id: "chan-1",
    code: "MERCADO_LIVRE",
    name: "Mercado Livre",
    status: "CONECTADO",
    accountName: "BIAMAKES_OFICIAL",
    storeUrl: "https://mercadolivre.com.br",
    activeAds: 24,
    feePercentage: 16.0,
    defaultShippingValue: 15.90,
    lastSync: "2026-11-10T13:30:00Z",
    color: "#FFE600"
  },
  {
    id: "chan-2",
    code: "SHOPEE",
    name: "Shopee",
    status: "CONECTADO",
    accountName: "biamakes.beauty",
    storeUrl: "https://shopee.com.br/biamakes.beauty",
    activeAds: 18,
    feePercentage: 14.0,
    defaultShippingValue: 9.90,
    lastSync: "2026-11-10T13:25:00Z",
    color: "#EE4D2D"
  },
  {
    id: "chan-3",
    code: "AMAZON",
    name: "Amazon Brasil",
    status: "SINCRONIZANDO",
    accountName: "Bia Makes Cosméticos",
    storeUrl: "https://amazon.com.br",
    activeAds: 12,
    feePercentage: 15.0,
    defaultShippingValue: 14.90,
    lastSync: "2026-11-10T12:00:00Z",
    color: "#FF9900"
  },
  {
    id: "chan-4",
    code: "TIKTOK",
    name: "TikTok Shop",
    status: "CONECTADO",
    accountName: "@biamakeoficial_",
    storeUrl: "https://tiktok.com/@biamakeoficial_",
    activeAds: 8,
    feePercentage: 10.0,
    defaultShippingValue: 7.90,
    lastSync: "2026-11-10T13:40:00Z",
    color: "#FE2C55"
  },
  {
    id: "chan-5",
    code: "SHEIN",
    name: "Shein Marketplace",
    status: "DESCONECTADO",
    accountName: "Não vinculado",
    activeAds: 0,
    feePercentage: 12.0,
    defaultShippingValue: 12.90,
    lastSync: "-",
    color: "#000000"
  },
  {
    id: "chan-6",
    code: "MAGALU",
    name: "Magalu Marketplace",
    status: "DESCONECTADO",
    accountName: "Não vinculado",
    activeAds: 0,
    feePercentage: 12.8,
    defaultShippingValue: 16.90,
    lastSync: "-",
    color: "#0086FF"
  }
];

export const initialCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Camila Guimarães",
    email: "camila.g@gmail.com",
    phone: "(11) 98765-4321",
    city: "São Paulo/SP",
    ordersCount: 4,
    totalSpent: 486.50,
    foundationShade: "Tom 02 — Bege Nude",
    skinType: "Mista",
    lastOrderDate: "2026-11-10"
  },
  {
    id: "cust-2",
    name: "Mariana Souza",
    email: "mari.souza@yahoo.com.br",
    phone: "(31) 98455-1122",
    city: "Belo Horizonte/MG",
    ordersCount: 3,
    totalSpent: 358.80,
    foundationShade: "Tom 01 — Porcelana Clara",
    skinType: "Seca",
    lastOrderDate: "2026-11-10"
  },
  {
    id: "cust-3",
    name: "Juliana Andrade",
    email: "ju.andrade@outlook.com",
    phone: "(21) 99123-5566",
    city: "Rio de Janeiro/RJ",
    ordersCount: 2,
    totalSpent: 219.80,
    foundationShade: "Tom 03 — Mel Dourado",
    skinType: "Oleosa",
    lastOrderDate: "2026-11-09"
  }
];

export const initialFinancial: FinancialMetric = {
  grossRevenue: 48950.00,
  marketplaceFees: 7240.00,
  cmv: 18450.00,
  operatingExpenses: 5600.00,
  netProfit: 17660.00,
  profitMargin: 36.08,
  ordersCount: 412,
  averageTicket: 118.81
};

export const initialUsers: SystemUser[] = [
  {
    id: "user-master-1",
    name: "Eduardo Nunes",
    username: "eduardo.nunes",
    password: "Admin@2026!",
    email: "eduardo.nunes@biamake.com.br",
    role: "ADMIN",
    isActive: true,
    isMaster: true,
    avatar: "/logo.jpg",
    createdAt: "2026-11-01T08:00:00Z"
  },
  {
    id: "user-2",
    name: "Bia Teixeira",
    username: "bia.teixeira",
    password: "Bia@2026!",
    email: "contato@biamake.com.br",
    role: "GERENTE",
    isActive: true,
    isMaster: false,
    avatar: "/logo.jpg",
    createdAt: "2026-11-02T10:00:00Z"
  },
  {
    id: "user-3",
    name: "Carla Martins",
    username: "carla.estoque",
    password: "Estoque@2026",
    email: "estoque@biamake.com.br",
    role: "ESTOQUE",
    isActive: true,
    isMaster: false,
    avatar: "/logo.jpg",
    createdAt: "2026-11-05T14:00:00Z"
  }
];

export const currentUser: SystemUser = initialUsers[0];

