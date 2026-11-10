export type ProductCategory = 
  | 'Rosto' 
  | 'Lábios' 
  | 'Olhos' 
  | 'Pincéis & Acessórios' 
  | 'Skincare' 
  | 'Kits de Presente';

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
  | 'CANCELADO';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  variationName?: string;
  quantity: number;
  price: number;
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
  shippingAmount?: number;
  status: OrderStatus;
  paymentMethod: string;
  shippingAddress: string;
  trackingCode?: string;
  createdAt: string;
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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  foundationShade?: string;
  skinType?: 'Oleosa' | 'Seca' | 'Mista' | 'Normal';
  lastOrderDate: string;
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
