export type ProductCategory = 
  | 'Rosto' 
  | 'Lábios' 
  | 'Olhos' 
  | 'Pincéis & Acessórios' 
  | 'Skincare' 
  | 'Kits de Presente'
  | 'Box Fechado';

export interface ProductVariation {
  id: string;
  name: string;
  colorHex: string;
  sku: string;
  stock: number;
}

export interface ProductSocialLinks {
  instagramUrl?: string;
  mercadoLivreUrl?: string;
  shopeeUrl?: string;
  tiktokUrl?: string;
  amazonUrl?: string;
  sheinUrl?: string;
  embedStockAndShipping: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  ean: string;
  category: ProductCategory;
  brand: string;
  costPrice: number;
  salePrice: number;
  promoPrice?: number;
  physicalStock: number;
  reservedStock: number;
  minStock: number; // Estoque de segurança
  shippingValue: number; // Valor de frete embutido/estimado para este produto
  freeShipping?: boolean; // Se possui frete grátis ativo
  batch: string; // Lote
  expiryDate: string; // Validade (YYYY-MM-DD)
  description: string;
  images: string[];
  variations: ProductVariation[];
  socialLinks: ProductSocialLinks;
  rating: number;
  reviewsCount: number;
  isFeatured?: boolean;
  tags?: string[];
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'RESERVA' | 'AJUSTE' | 'DEVOLUCAO';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason: string;
  operator: string;
  date: string;
}

export type ChannelType = 
  | 'SITE' 
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'WHATSAPP'
  | 'MERCADO_LIVRE' 
  | 'SHOPEE' 
  | 'AMAZON' 
  | 'TIKTOK' 
  | 'SHEIN' 
  | 'MAGALU' 
  | 'BALCAO';

export type OrderStatus = 
  | 'PENDENTE' 
  | 'PAGO' 
  | 'SEPARACAO' 
  | 'ENVIADO' 
  | 'CONCLUIDO' 
  | 'DEVOLUCAO'
  | 'CANCELADO';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  variationName?: string;
  quantity: number;
  price: number;
}

export type ShippingCarrierId =
  | 'CORREIOS_PAC'
  | 'JADLOG_PACKAGE'
  | 'CORREIOS_SEDEX'
  | 'LOGGI_EXPRESS';

export interface ShippingQuoteOption {
  carrierId: ShippingCarrierId;
  carrierName: string;        // Ex: "Correios PAC", "Jadlog Package", "Correios SEDEX", "Loggi Express"
  serviceLabel: string;       // Ex: "Econômico", "Rápido", "Expresso"
  deliveryDays: string;       // Ex: "3 a 5 dias úteis"
  companyCost: number;        // CUSTO REAL que a Bia Makes paga à transportadora (SEMPRE > 0, nunca zera!)
  customerPrice: number;      // Valor cobrado do cliente (0 se tiver Frete Grátis elegível na modalidade, ou valor integral)
  isFreeForCustomer: boolean; // true quando sai grátis para o cliente
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: ChannelType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAmount?: number;            // Valor de frete PAGO PELO CLIENTE (R$ 0,00 quando Frete Grátis)
  companyShippingCost?: number;       // CUSTO REAL DO FRETE PAGO PELA BIA MAKES à transportadora (ex: R$ 16,90)
  shippingCarrier?: string;           // Nome da transportadora escolhida (ex: "Correios PAC" ou "Jadlog Package")
  shippingServiceDays?: string;       // Prazo prometido (ex: "2 a 4 dias úteis")
  shippingCep?: string;               // CEP de destino (ex: "01310-100")
  isFreeShippingSubsidized?: boolean; // true quando o cliente não pagou frete e a loja absorveu o custo
  status: OrderStatus;
  paymentMethod: string;
  shippingAddress: string;
  trackingCode?: string;
  createdAt: string;
  attribution?: {
    source: string;
    medium?: string;
    campaign?: string;
    link_code?: string;
  };
}

export interface MarketplaceChannel {
  id: string;
  code: ChannelType;
  name: string;
  status: 'CONECTADO' | 'DESCONECTADO' | 'SINCRONIZANDO' | 'ERRO';
  accountName: string;
  storeUrl?: string;
  activeAds: number;
  feePercentage: number;
  defaultShippingValue?: number;
  lastSync: string;
  color: string;
}

export interface FinancialMetric {
  grossRevenue: number;
  marketplaceFees: number;
  cmv: number; // Custo Mercadoria Vendida
  operatingExpenses: number;
  netProfit: number;
  profitMargin: number;
  ordersCount: number;
  averageTicket: number;
  refundedAmount?: number;
  refundedOrdersCount?: number;
  totalCompanyShippingCost?: number;    // Soma de todos os fretes pagos pela empresa nos pedidos ativos
  subsidizedFreeShippingCost?: number;  // Quanto a empresa gastou bancando "Frete Grátis" para clientes
  customerPaidShippingTotal?: number;   // Quanto os clientes pagaram de frete (quando não era grátis)
}

export type UserRole = 'ADMIN' | 'GERENTE' | 'ESTOQUE' | 'VENDAS' | 'FINANCEIRO';

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isMaster?: boolean;
  avatar: string;
  createdAt?: string;
}
