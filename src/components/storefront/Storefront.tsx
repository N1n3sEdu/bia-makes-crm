"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  Sparkles, 
  Heart, 
  Star,
  Check, 
  ShoppingBag, 
  ArrowRight, 
  ArrowUpDown,
  X, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Truck, 
  MessageCircle,
  Award,
  Instagram,
  Share2,
  ExternalLink,
  MapPin,
  Lock,
  Copy
} from "lucide-react";
import { Product, ProductCategory, ProductVariation, ShippingCarrierId } from "@/types";
import { CepInfo, formatCurrency, formatDateShort, fetchCepInfo, formatCepMask, calculateCarrierQuotesByCep } from "@/lib/utils";
import { CartItem, useBiaMakes } from "@/context/BiaMakesContext";
import { STORE_CONFIG } from "@/lib/data";
import { CheckoutModal } from "./CheckoutModal";
import { ProductImage } from "./ProductImage";
import { trackEvent } from "@/lib/analytics/track";

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'discount';

const WISHLIST_STORAGE_KEY = "biamakes_wishlist_v1";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

interface StorefrontProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product, variation?: ProductVariation, openCart?: boolean) => boolean | void;
  onUpdateCartQuantity: (index: number, quantity: number) => void;
  onRemoveFromCart: (index: number) => void;
  isCartOpen: boolean;
  onOpenCart?: () => void;
  onCloseCart: () => void;
  selectedCategory?: ProductCategory | 'Todos';
  onSelectCategory?: (category: ProductCategory | 'Todos') => void;
}

const categories: (ProductCategory | 'Todos')[] = [
  'Todos',
  'Rosto',
  'Lábios',
  'Olhos',
  'Pincéis & Acessórios',
  'Skincare',
  'Kits de Presente',
  'Box Fechado'
];

export function Storefront({
  products,
  cart,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  isCartOpen,
  onOpenCart,
  onCloseCart,
  selectedCategory: externalSelectedCategory,
  onSelectCategory: externalOnSelectCategory,
}: StorefrontProps) {
  const { createStorefrontOrder } = useBiaMakes();
  const [internalCategory, setInternalCategory] = useState<ProductCategory | 'Todos'>('Todos');
  const selectedCategory = externalSelectedCategory !== undefined ? externalSelectedCategory : internalCategory;
  const setSelectedCategory = externalOnSelectCategory || setInternalCategory;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistHydrated, setWishlistHydrated] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{
    image: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  } | null>(null);

  const [addedSuccessModal, setAddedSuccessModal] = useState<{
    product: Product;
    variation?: ProductVariation;
  } | null>(null);

  const triggerFlyToCart = (
    startElement: HTMLElement | null,
    product: Product,
    variation?: ProductVariation
  ) => {
    const cartButton = document.getElementById("header-cart-button");

    if (startElement && cartButton) {
      const startRect = startElement.getBoundingClientRect();
      const targetRect = cartButton.getBoundingClientRect();

      setFlyingItem({
        image: product.images?.[0] || "/logo.jpg",
        startX: startRect.left + startRect.width / 2,
        startY: startRect.top + startRect.height / 2,
        targetX: targetRect.left + targetRect.width / 2,
        targetY: targetRect.top + targetRect.height / 2,
      });

      // Animação de impacto no ícone da sacola
      setTimeout(() => {
        cartButton.classList.remove("animate-cart-bounce");
        void cartButton.offsetWidth; // Força reflow
        cartButton.classList.add("animate-cart-bounce");
      }, 750);

      // Finaliza o voo
      setTimeout(() => {
        setFlyingItem(null);
      }, 850);
    }

    // Exibe modal de confirmação bonito e moderno
    setAddedSuccessModal({ product, variation });
  };

  const handleAddWithToast = (
    product: Product,
    variation?: ProductVariation,
    event?: React.MouseEvent
  ) => {
    const added = onAddToCart(product, variation, false);
    if (added === false) return false;

    const clickedEl = (event?.currentTarget as HTMLElement) || null;
    triggerFlyToCart(clickedEl, product, variation);

    return true;
  };
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeVariations, setActiveVariations] = useState<Record<string, ProductVariation>>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string>('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // CEP Calculator state shared between Quick View, Cart Drawer & Checkout
  const [cepInput, setCepInput] = useState('');
  const [cepError, setCepError] = useState('');
  const [isCalculatingCep, setIsCalculatingCep] = useState(false);
  const [cepInfo, setCepInfo] = useState<CepInfo | null>(null);
  const [selectedCartCarrierId, setSelectedCartCarrierId] = useState<ShippingCarrierId | null>(null);
  const [cepResult, setCepResult] = useState<{
    pac: number;
    sedex: number;
    express: number;
    city: string;
    pacDays: string;
    sedexDays: string;
    expressDays: string;
  } | null>(null);
  const [quickViewSelectedOption, setQuickViewSelectedOption] = useState<'pac' | 'sedex' | 'express'>('pac');
  const [quickViewVar, setQuickViewVar] = useState<ProductVariation | undefined>(undefined);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWishlistIds(parsed.filter((id): id is string => typeof id === 'string'));
        }
      }
    } catch {
      // Ignora erros de acesso ao localStorage
    } finally {
      setWishlistHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!wishlistHydrated) return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // Ignora erro de escrita no localStorage
    }
  }, [wishlistIds, wishlistHydrated]);

  const toggleWishlist = (productId: string) => {
    setWishlistIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle variation selection
  const handleSelectVariation = (productId: string, variation: ProductVariation) => {
    setActiveVariations(prev => ({ ...prev, [productId]: variation }));
  };

  // Calculate CEP Shipping com consulta real ViaCEP + BrasilAPI + cotação de transportadoras
  const runCepLookup = async (rawValue: string, product?: Product | null) => {
    const cleanCep = rawValue.replace(/\D/g, '');
    if (cleanCep.length < 8) {
      setCepError('Digite um CEP válido com 8 dígitos (Ex: 01310-100).');
      setCepResult(null);
      setCepInfo(null);
      return;
    }

    setCepError('');
    setIsCalculatingCep(true);
    try {
      const info = await fetchCepInfo(cleanCep);
      setCepInfo(info);

      const refProduct = product || quickViewProduct || cart[0]?.product;
      const itemPrice = refProduct ? (refProduct.promoPrice || refProduct.salePrice) : subtotal;
      const isItemFree = refProduct ? Boolean(refProduct.freeShipping) : false;
      const quotes = calculateCarrierQuotesByCep(info, 1, itemPrice, isItemFree);
      const pacQuote = quotes.find((q) => q.carrierId === "CORREIOS_PAC") || quotes[0];
      const sedexQuote = quotes.find((q) => q.carrierId === "CORREIOS_SEDEX");
      const expressQuote = quotes.find((q) => q.carrierId === "LOGGI_EXPRESS");

      const locationPrefix = info.bairro ? `${info.bairro} — ` : '';
      setCepResult({
        pac: pacQuote ? pacQuote.customerPrice : 13.50,
        sedex: sedexQuote ? sedexQuote.customerPrice : 18.90,
        express: expressQuote ? expressQuote.customerPrice : (sedexQuote ? sedexQuote.customerPrice : 16.90),
        city: `📍 Entrega para ${locationPrefix}${info.localidade}/${info.uf} (${info.estimatedDaysLabel})`,
        pacDays: pacQuote?.deliveryDays || info.pacDaysLabel,
        sedexDays: sedexQuote?.deliveryDays || info.sedexDaysLabel,
        expressDays: expressQuote?.deliveryDays || info.expressDaysLabel,
      });
    } catch (err) {
      setCepError(err instanceof Error ? err.message : 'CEP não encontrado.');
      setCepResult(null);
      setCepInfo(null);
    } finally {
      setIsCalculatingCep(false);
    }
  };

  const handleCalculateCep = async (product: Product) => {
    await runCepLookup(cepInput, product);
  };

  const handleSharedCepInputChange = (rawVal: string, product?: Product | null) => {
    const masked = formatCepMask(rawVal);
    setCepInput(masked);
    if (cepError) setCepError('');
    const digits = masked.replace(/\D/g, '');
    if (digits.length < 8) {
      if (cepInfo) setCepInfo(null);
      if (cepResult) setCepResult(null);
      return;
    }
    if (digits.length === 8) {
      void runCepLookup(digits, product);
    }
  };

  // Copy shareable social link with embedded stock & shipping
  const handleCopySocialLink = (sku: string) => {
    const url = `${window.location.origin}/p/${sku}`;
    navigator.clipboard.writeText(url);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2500);
  };

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery.trim());

    const filtered = products.filter(p => {
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesFavorites = !onlyFavorites || wishlistIds.includes(p.id);
      if (!matchesCategory || !matchesFavorites) return false;

      if (!normalizedQuery) return true;
      return (
        normalizeSearchText(p.name).includes(normalizedQuery) ||
        normalizeSearchText(p.category).includes(normalizedQuery) ||
        normalizeSearchText(p.brand).includes(normalizedQuery) ||
        normalizeSearchText(p.sku).includes(normalizedQuery) ||
        normalizeSearchText(p.description).includes(normalizedQuery) ||
        Boolean(p.tags?.some(tag => normalizeSearchText(tag).includes(normalizedQuery)))
      );
    });

    const getEffectivePrice = (p: Product) => p.promoPrice && p.promoPrice < p.salePrice ? p.promoPrice : p.salePrice;
    const getDiscountPct = (p: Product) =>
      p.promoPrice && p.promoPrice < p.salePrice && p.salePrice > 0
        ? (p.salePrice - p.promoPrice) / p.salePrice
        : 0;

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return getEffectivePrice(a) - getEffectivePrice(b);
        case 'price-desc':
          return getEffectivePrice(b) - getEffectivePrice(a);
        case 'rating':
          if (b.rating !== a.rating) return b.rating - a.rating;
          return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        case 'discount':
          return getDiscountPct(b) - getDiscountPct(a);
        case 'featured':
        default: {
          const featDiff = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
          if (featDiff !== 0) return featDiff;
          return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        }
      }
    });
  }, [products, selectedCategory, onlyFavorites, wishlistIds, searchQuery, sortBy]);

  // Cart totals
  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.promoPrice || item.product.salePrice;
    return acc + price * item.quantity;
  }, 0);

  const discountValue = (subtotal * appliedDiscount) / 100;
  const totalCartUnits = cart.reduce((acc, item) => acc + item.quantity, 0);
  const allItemsHaveFreeShipping =
    cart.length > 0 && cart.every((item) => Boolean(item.product.freeShipping));

  // Cotações reais para o carrinho quando o cliente já informou um CEP válido
  const cartShippingQuotes = useMemo(() => {
    if (!cepInfo || cart.length === 0) return [];
    return calculateCarrierQuotesByCep(
      cepInfo,
      totalCartUnits,
      subtotal,
      allItemsHaveFreeShipping
    );
  }, [cepInfo, cart.length, totalCartUnits, subtotal, allItemsHaveFreeShipping]);

  const selectedCartQuote = useMemo(() => {
    if (cartShippingQuotes.length === 0) return null;
    if (selectedCartCarrierId) {
      const found = cartShippingQuotes.find((q) => q.carrierId === selectedCartCarrierId);
      if (found) return found;
    }
    if (quickViewSelectedOption === 'sedex') {
      return cartShippingQuotes.find((q) => q.carrierId === 'CORREIOS_SEDEX') || cartShippingQuotes[0];
    }
    if (quickViewSelectedOption === 'express') {
      return cartShippingQuotes.find((q) => q.carrierId === 'LOGGI_EXPRESS') || cartShippingQuotes[0];
    }
    return cartShippingQuotes[0];
  }, [cartShippingQuotes, selectedCartCarrierId, quickViewSelectedOption]);

  // Regra obrigatória: com CEP em branco, NUNCA somar frete ao Total da compra
  const shipping = selectedCartQuote ? selectedCartQuote.customerPrice : 0;
  const total = Math.max(0, subtotal - discountValue + shipping);

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'BIAMAKE10') {
      setAppliedDiscount(10);
      setCouponMessage('Cupom de 10% OFF aplicado com sucesso! ✨');
    } else {
      setAppliedDiscount(0);
      setCouponMessage('Cupom inválido. Tente BIAMAKE10.');
    }
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    const fallbackCompanyShipping =
      Math.round((13.5 + Math.max(0, totalCartUnits - 1) * 1.4) * 100) / 100;
    const companyShippingCost = selectedCartQuote
      ? selectedCartQuote.companyCost
      : fallbackCompanyShipping;

    const order = createStorefrontOrder({
      customerName: 'Cliente via WhatsApp',
      customerPhone: 'Via WhatsApp Direct',
      shippingAddress: cepInfo
        ? `${cepInfo.bairro ? `${cepInfo.bairro} - ` : ''}${cepInfo.localidade}/${cepInfo.uf} (CEP: ${cepInfo.cep})`
        : 'A combinar via WhatsApp',
      paymentMethod: 'WHATSAPP',
      channel: 'WHATSAPP',
      shippingAmount: shipping,
      companyShippingCost,
      shippingCarrier: selectedCartQuote?.carrierName || 'Jadlog Package / Correios PAC',
      shippingServiceDays: selectedCartQuote?.deliveryDays,
      shippingCep: cepInfo?.cep,
      isFreeShippingSubsidized: shipping === 0,
      discountAmount: discountValue,
      items: cart,
    });
    
    let text = `Olá Bia Makes! 💕 Realizei o pedido *#${order.orderNumber}* pelo site e gostaria de confirmar:\n\n`;
    order.items.forEach((item, idx) => {
      const variationText = item.variationName ? ` (${item.variationName})` : '';
      text += `${idx + 1}. *${item.productName}*${variationText} - ${item.quantity}x ${formatCurrency(item.price)}\n`;
    });
    text += `\n*Subtotal:* ${formatCurrency(subtotal)}`;
    if (appliedDiscount > 0) text += `\n*Desconto:* -${formatCurrency(discountValue)} (BIAMAKE10)`;
    text += `\n*Frete Calculado:* ${shipping === 0 ? 'GRÁTIS' : formatCurrency(shipping)}`;
    text += `\n*TOTAL:* ${formatCurrency(order.totalAmount)}\n\nPor favor, confirmem o envio e a chave PIX! ✨`;

    trackEvent("outbound_click", { target: "whatsapp" });
    trackEvent("whatsapp_order", {
      value_cents: Math.round(order.totalAmount * 100),
      order_number: order.orderNumber,
    });
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${STORE_CONFIG.whatsappNumber}&text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F8]">
      
      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F5DDE5]/60 via-[#FAF7F8] to-[#FAF7F8] border-b border-[#E9D9CD]/40 py-12 md:py-20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#EDE5F3]/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#F5DDE5]/80 blur-2xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#C69A76]/30 shadow-sm">
                <Sparkles className="w-4 h-4 text-[#C69A76]" />
                <span className="text-xs font-bold text-[#7A3F51] tracking-wide uppercase">
                  Nova Coleção Exclusiva & Alta Performance
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#39313A] leading-[1.12] tracking-tight">
                Realce a sua beleza com{" "}
                <span className="relative inline-block text-[#9C5B6F]">
                  sofisticação
                  <svg
                    className="absolute left-0 -bottom-2 w-full h-2.5 text-[#C69A76]/50"
                    viewBox="0 0 100 12"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 6 Q 6.25 0, 12.5 6 T 25 6 T 37.5 6 T 50 6 T 62.5 6 T 75 6 T 87.5 6 T 100 6"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                </span>{" "}
                & elegância.
              </h1>

              <p className="text-base sm:text-lg text-[#39313A]/80 max-w-2xl font-normal leading-relaxed">
                Fórmulas enriquecidas com ativos dermatológicos, alta pigmentação e acabamento aveludado impecável. Estoque em tempo real e envio imediato para todo o Brasil.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button 
                  onClick={() => {
                    const el = document.getElementById('catalogo');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] text-white font-semibold shadow-lg shadow-[#9C5B6F]/20 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 text-sm"
                >
                  <span>Explorar Catálogo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a 
                  href={STORE_CONFIG.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-full bg-white border border-[#E9D9CD] text-[#7A3F51] font-semibold hover:bg-[#FAF7F8] hover:border-[#C69A76] transition-all flex items-center gap-2 shadow-sm text-sm"
                >
                  <Instagram className="w-4 h-4 text-[#9C5B6F]" />
                  <span>@biamakeoficial_</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E9D9CD]/50 text-left">
                <div>
                  <div className="text-sm font-bold text-[#7A3F51]">Estoque Sincronizado</div>
                  <div className="text-xs text-[#39313A]/70">Disponibilidade em tempo real</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#7A3F51]">Frete Transparente</div>
                  <div className="text-xs text-[#39313A]/70">Valor embutido em cada item</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#7A3F51]">Multicanal Oficial</div>
                  <div className="text-xs text-[#39313A]/70">Site, Insta, Shopee & ML</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-72 sm:w-80 lg:w-96 aspect-square rounded-full p-3 bg-gradient-to-tr from-[#C69A76] via-[#FAF0F4] to-[#9C5B6F] shadow-2xl">
                <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-white">
                  <Image 
                    src="/logo.jpg" 
                    alt="Bia Makes Destaque"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -bottom-2 -left-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-[#E9D9CD] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F5DDE5] flex items-center justify-center text-[#9C5B6F]">
                    <Award className="w-5 h-5 text-[#C69A76]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#39313A]">Marca Favorita</div>
                    <div className="text-[10px] text-[#39313A]/70 font-medium">+10.000 makes entregues</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Controls: Search and Categories */}
        <div className="space-y-6 mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-[#39313A] tracking-tight">
                Catálogo Oficial Bia Makes
              </h2>
              <p className="text-xs text-[#39313A]/70 mt-1 font-medium">
                Cada produto exibe seu estoque disponível em tempo real, valor de frete embutido e links diretos das nossas redes.
              </p>
            </div>

            {/* Search Input + Sort Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bia-marsala" />
                <input 
                  type="text"
                  placeholder="Buscar produto, SKU (BM-BASE-01) ou tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 text-xs bg-white rounded-full border border-bia-nude focus:outline-none focus:ring-2 focus:ring-bia-marsala/40 focus:border-bia-marsala shadow-sm transition-all font-medium text-bia-text"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-bia-marsala-dark cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 text-bia-marsala absolute left-3.5 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Ordenar produtos"
                  className="w-full sm:w-auto pl-9 pr-8 py-2.5 text-xs bg-white rounded-full border border-bia-nude text-bia-text font-semibold focus:outline-none focus:ring-2 focus:ring-bia-marsala/40 focus:border-bia-marsala shadow-sm transition-all cursor-pointer appearance-none"
                >
                  <option value="featured">Ordenar: Destaques Bia Makes</option>
                  <option value="price-asc">Ordenar: Menor Preço</option>
                  <option value="price-desc">Ordenar: Maior Preço</option>
                  <option value="rating">Ordenar: Melhor Avaliação</option>
                  <option value="discount">Ordenar: Maior % de Desconto</option>
                </select>
                <span className="pointer-events-none absolute right-3 text-[11px] text-bia-marsala-dark font-bold">▾</span>
              </div>
            </div>
          </div>

          {/* Category Chips + Wishlist Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setOnlyFavorites(prev => !prev)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                onlyFavorites
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-[#FAF0F4] text-[#7A3F51] border-[#E9D9CD] hover:border-rose-300 hover:bg-rose-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'}`} />
              <span>Meus Favoritos ({wishlistIds.length})</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 ${
                    isSelected 
                      ? 'bg-bia-marsala text-white shadow-md' 
                      : 'bg-white text-bia-text border border-bia-nude hover:bg-bia-pink/40 hover:border-bia-marsala/40'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-bia-nude p-8 space-y-3">
            {onlyFavorites ? (
              <>
                <Heart className="w-10 h-10 text-rose-400 mx-auto" />
                <h3 className="font-display text-xl font-bold text-bia-text">
                  Nenhum favorito encontrado neste filtro
                </h3>
                <p className="text-xs text-bia-text/75">
                  Toque no coração dos produtos que você mais ama para salvar sua lista de desejos aqui.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOnlyFavorites(false);
                    setSearchQuery('');
                    setSelectedCategory('Todos');
                  }}
                  className="px-4 py-2 rounded-full bg-bia-marsala text-white text-xs font-bold hover:bg-bia-marsala-dark transition-colors cursor-pointer"
                >
                  Ver Todos os Produtos
                </button>
              </>
            ) : (
              <>
                <Sparkles className="w-10 h-10 text-bia-rosegold mx-auto" />
                <h3 className="font-display text-xl font-bold text-bia-text">Nenhum produto encontrado</h3>
                <p className="text-xs text-bia-text/75">Tente ajustar a sua busca por nome, SKU ou tag, ou selecione outra categoria.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const selectedVar = activeVariations[product.id] || product.variations[0];
              const availableStock = product.physicalStock - product.reservedStock;
              const isVarOutOfStock = selectedVar 
                ? (typeof selectedVar.stock === 'number' ? selectedVar.stock <= 0 : false)
                : availableStock <= 0;
              const hasDiscount = Boolean(product.promoPrice && product.promoPrice < product.salePrice);
              const price = product.promoPrice || product.salePrice;
              const isFreeShipping = product.freeShipping || product.shippingValue === 0;

              const openProductDetails = () => {
                trackEvent("product_view", { product_sku: product.sku });
                setQuickViewProduct(product);
                setQuickViewVar(activeVariations[product.id] || product.variations?.[0]);
                setQuickViewImageIndex(0);
                setCepResult(null);
                setCepError('');
                setQuickViewSelectedOption('pac');
              };

              return (
                <div 
                  key={product.id}
                  onClick={openProductDetails}
                  className="h-full bg-white rounded-3xl border border-[#E9D9CD]/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C69A76]/60 transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] bg-bia-offwhite overflow-hidden">
                    <ProductImage 
                      src={product.images[0]} 
                      alt={product.name}
                      fill
                      className={`object-cover transition-all duration-500 ${
                        product.images[1] ? 'group-hover:opacity-0' : 'group-hover:scale-105'
                      }`}
                    />
                    {product.images[1] && (
                      <ProductImage 
                        src={product.images[1]} 
                        alt={`${product.name} — Textura / Swatch`}
                        fill
                        className="object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    )}

                    {/* Tag Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {hasDiscount && (
                        <span className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#9C5B6F] rounded-full shadow-md uppercase tracking-wider">
                          Oferta Especial
                        </span>
                      )}
                      {isFreeShipping && (
                        <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-900 bg-emerald-100/95 border border-emerald-300 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1">
                          <Truck className="w-3 h-3 text-emerald-700" />
                          Frete Grátis
                        </span>
                      )}
                    </div>

                    {/* Top Right Live Stock Pill */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm border ${
                        availableStock > 15
                          ? 'bg-white/90 text-emerald-800 border-emerald-200'
                          : availableStock > 0
                          ? 'bg-amber-50/95 text-amber-800 border-amber-200'
                          : 'bg-rose-50/95 text-rose-700 border-rose-200'
                      }`}>
                        {availableStock > 0 ? `Estoque: ${availableStock} un.` : 'Esgotado'}
                      </span>
                    </div>

                    {/* Wishlist Heart Button (bottom-left) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      aria-label={wishlistIds.includes(product.id) ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`}
                      title={wishlistIds.includes(product.id) ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
                      className="absolute bottom-3 left-3 z-10 p-2.5 bg-white/95 hover:bg-white rounded-full shadow-md transition-all cursor-pointer border border-bia-nude/60"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          wishlistIds.includes(product.id)
                            ? 'fill-rose-500 text-rose-500'
                            : 'text-bia-marsala hover:text-rose-500'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    {/* Bloco Superior */}
                    <div>
                      <h3 className="font-display text-lg font-bold text-bia-text group-hover:text-bia-marsala transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      <p className="text-xs text-bia-text/75 line-clamp-2 mt-1.5 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Seletor de Tom / Variação */}
                      {product.variations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-bia-nude/50">
                          <div className="flex items-center gap-1.5 mb-2 text-xs">
                            <span className="font-semibold text-bia-text/75">Tom:</span>
                            <span className={`font-semibold truncate ${isVarOutOfStock ? 'text-rose-600' : 'text-bia-marsala'}`}>
                              {selectedVar?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {product.variations.map((v) => {
                              const isCurrent = selectedVar?.id === v.id;
                              const isOutOfStock = v.stock <= 0;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectVariation(product.id, v);
                                  }}
                                  className={`relative w-6 h-6 rounded-full ring-1 ring-inset ring-black/15 transition-transform cursor-pointer ${
                                    isCurrent ? 'ring-2 ring-bia-marsala scale-110 border-2 border-white' : 'hover:scale-105'
                                  } ${isOutOfStock ? 'opacity-40' : ''}`}
                                  style={{ backgroundColor: v.colorHex }}
                                  title={`${v.name}${isOutOfStock ? ' (Esgotado)' : ''}`}
                                  aria-label={`Selecionar tom ${v.name}`}
                                >
                                  {isOutOfStock && (
                                    <span className="absolute inset-0 flex items-center justify-center text-[11px] text-rose-800 font-extrabold leading-none">
                                      ✕
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bloco Inferior: Valor + Botão Comprar */}
                    <div className="pt-4 mt-4 border-t border-bia-nude/50 flex items-center justify-between gap-3">
                      <div>
                        {hasDiscount && (
                          <span className="text-xs text-gray-400 line-through block font-medium">
                            {formatCurrency(product.salePrice)}
                          </span>
                        )}
                        <span className="text-2xl font-extrabold text-bia-marsala-dark leading-tight block">
                          {formatCurrency(price)}
                        </span>
                        <div className="text-[11px] text-bia-text/65 font-medium">
                          ou 3x de {formatCurrency(price / 3)} sem juros
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddWithToast(product, selectedVar, e);
                        }}
                        disabled={isVarOutOfStock}
                        className={`rounded-full px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 ${
                          !isVarOutOfStock
                            ? 'bg-bia-marsala hover:bg-bia-marsala-dark text-white shadow-soft cursor-pointer'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isVarOutOfStock ? (selectedVar ? 'Tom Esgotado' : 'Esgotado') : 'Comprar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* SOCIAL NETWORKS & EMBEDDED STOCK TRANSPARENCY BANNER */}
      <section id="redes-canais" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-[#FAF0F4] via-white to-[#EDE5F3] rounded-3xl border border-[#E9D9CD] p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9C5B6F] uppercase tracking-wider">
                <Share2 className="w-4 h-4 text-[#C69A76]" />
                <span>Compre pelo Seu Canal Preferido com Estoque & Frete Sincronizados</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#39313A]">
                Nossas Redes Sociais e Lojas Oficiais Integradas
              </h3>
              <p className="text-xs sm:text-sm text-[#39313A]/75 leading-relaxed">
                Todos os produtos da <strong>Bia Makes</strong> possuem link direto para o Instagram (<code>{STORE_CONFIG.instagramHandle}</code>), Shopee, Mercado Livre e TikTok Shop, mantendo o <strong>estoque real embutido</strong> e o <strong>cálculo transparente de frete</strong> em qualquer canal.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap gap-2.5 justify-start lg:justify-end">
              <a
                href={STORE_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("outbound_click", { target: "instagram" })}
                className="px-4 py-2.5 rounded-2xl bg-[#9C5B6F] text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-[#7A3F51] transition-all"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram Oficial</span>
              </a>
              <a
                href={STORE_CONFIG.shopeeStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("outbound_click", { target: "shopee" })}
                className="px-4 py-2.5 rounded-2xl bg-white border border-[#E9D9CD] text-[#39313A] text-xs font-bold flex items-center gap-2 hover:border-[#9C5B6F] transition-all"
              >
                <span>Loja Shopee</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C69A76]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK VIEW MODAL WITH CEP FREIGHT CALCULATOR & SOCIAL LINKS */}
      {quickViewProduct && (
        <div 
          onClick={() => setQuickViewProduct(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 relative shadow-2xl border border-[#E9D9CD] overflow-y-auto max-h-[92vh] my-auto space-y-6"
          >
            {/* Header: Categoria, Estoque e Botão Fechar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E9D9CD]/70 pr-10">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#C69A76] uppercase tracking-wider bg-[#FAF0F4] px-3 py-1 rounded-full border border-[#E9D9CD]">
                  {quickViewProduct.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {quickViewProduct.physicalStock - quickViewProduct.reservedStock} un. estoque geral
                </span>
              </div>

              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 1. Imagem Principal e Galeria de Fotos */}
            <div className="space-y-3">
              <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[380px] rounded-3xl overflow-hidden bg-bia-offwhite border border-bia-nude shadow-inner">
                <ProductImage 
                  src={quickViewProduct.images[quickViewImageIndex] || quickViewProduct.images[0]} 
                  alt={`${quickViewProduct.name} - Foto ${quickViewImageIndex + 1}`}
                  fill
                  className="object-contain sm:object-cover"
                />
              </div>

              {/* Miniaturas da Galeria quando há múltiplas imagens */}
              {quickViewProduct.images && quickViewProduct.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 scrollbar-none">
                  {quickViewProduct.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickViewImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        quickViewImageIndex === idx
                          ? 'border-bia-marsala ring-4 ring-bia-marsala/20 scale-[1.04]'
                          : 'border-bia-nude opacity-70 hover:opacity-100 hover:border-bia-marsala/50'
                      }`}
                    >
                      <ProductImage
                        src={imgUrl}
                        alt={`${quickViewProduct.name} miniatura ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Nome do Produto e Avaliação */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#39313A]">
                  {quickViewProduct.name}
                </h2>
                <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{quickViewProduct.rating}</span>
                  <span className="text-gray-500 font-normal text-xs">({quickViewProduct.reviewsCount} avaliações)</span>
                </div>
              </div>

              {/* Selos e Tags Dermatológicas */}
              {quickViewProduct.tags && quickViewProduct.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickViewProduct.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-[#7A3F51] text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C69A76]" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Descrição Completa */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/80 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7A3F51] block">
                Sobre este Produto
              </span>
              <p className="text-sm text-[#39313A]/90 leading-relaxed font-normal">
                {quickViewProduct.description}
              </p>
            </div>

            {/* 4. Seleção de Tom / Variação */}
            {quickViewProduct.variations && quickViewProduct.variations.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E9D9CD] shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#39313A] text-sm">Escolha o Tom / Variação:</span>
                  <span className={`font-bold text-xs ${quickViewVar && quickViewVar.stock <= 0 ? 'text-rose-600' : 'text-[#9C5B6F]'}`}>
                    {quickViewVar?.name} ({quickViewVar ? (quickViewVar.stock <= 0 ? 'ESGOTADO' : `${quickViewVar.stock} un disponíveis`) : ''})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {quickViewProduct.variations.map((v) => {
                    const isCurrent = quickViewVar?.id === v.id;
                    const isOutOfStock = v.stock <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setQuickViewVar(v);
                          handleSelectVariation(quickViewProduct.id, v);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-bia-marsala text-white border-bia-marsala shadow-sm scale-105'
                            : 'bg-white text-bia-text border-bia-nude hover:border-bia-marsala hover:bg-[#FAF0F4]'
                        } ${isOutOfStock ? 'opacity-50' : ''}`}
                      >
                        <span
                          className="w-4 h-4 rounded-full ring-1 ring-inset ring-black/20 shrink-0"
                          style={{ backgroundColor: v.colorHex }}
                        />
                        <span>{v.name}</span>
                        {isOutOfStock && <span className="text-[11px] text-rose-300 font-extrabold">(Esgotado)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Preço e Valores */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-[#FAF0F4] via-white to-[#EDE5F3] p-4 sm:p-5 rounded-2xl border border-[#E9D9CD] gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-bia-marsala-dark block">
                  Valor Unitário
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-bia-marsala-dark">
                    {formatCurrency(quickViewProduct.promoPrice || quickViewProduct.salePrice)}
                  </span>
                  {quickViewProduct.promoPrice && quickViewProduct.promoPrice < quickViewProduct.salePrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(quickViewProduct.salePrice)}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  ou 3x de {formatCurrency((quickViewProduct.promoPrice || quickViewProduct.salePrice) / 3)} sem juros
                </span>
              </div>

              <div className="sm:text-right bg-white/80 px-4 py-2.5 rounded-xl border border-[#E9D9CD]/80">
                <span className="text-xs uppercase font-bold text-bia-rosegold-dark block">
                  Frete Selecionado
                </span>
                {cepResult ? (
                  <span className="text-base font-extrabold text-emerald-700">
                    {cepResult[quickViewSelectedOption] === 0
                      ? 'FRETE GRÁTIS'
                      : formatCurrency(cepResult[quickViewSelectedOption])}
                  </span>
                ) : quickViewProduct.freeShipping || (quickViewProduct.promoPrice || quickViewProduct.salePrice) >= STORE_CONFIG.freeShippingThreshold ? (
                  <span className="text-base font-extrabold text-emerald-700">
                    FRETE GRÁTIS
                  </span>
                ) : (
                  <span className="text-sm font-bold text-bia-marsala-dark">
                    A calcular pelo CEP
                  </span>
                )}
              </div>
            </div>

            {/* 6. Calculadora de Frete por CEP */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] space-y-3">
              <label className="block text-xs font-bold text-[#39313A] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#9C5B6F]" />
                <span className="text-sm">Calcular Frete e Escolher Modalidade de Envio:</span>
              </label>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Digite seu CEP (ex: 01310-100)"
                  value={cepInput}
                  onChange={(e) => {
                    setCepInput(formatCepMask(e.target.value));
                    if (cepError) setCepError('');
                  }}
                  maxLength={9}
                  className={`flex-1 px-4 py-2.5 text-xs bg-white rounded-xl border focus:outline-none shadow-xs ${
                    cepError
                      ? 'border-rose-400 focus:border-rose-500'
                      : 'border-[#E9D9CD] focus:border-[#9C5B6F]'
                  }`}
                />
                <button
                  type="button"
                  disabled={isCalculatingCep}
                  onClick={() => handleCalculateCep(quickViewProduct)}
                  className="px-5 py-2.5 bg-[#9C5B6F] text-white text-xs font-bold rounded-xl hover:bg-[#7A3F51] disabled:opacity-60 cursor-pointer shadow-sm transition-all"
                >
                  {isCalculatingCep ? 'Buscando...' : 'Calcular'}
                </button>
              </div>
              {cepError && (
                <p role="alert" className="text-xs font-semibold text-rose-600">
                  {cepError}
                </p>
              )}
              {cepResult && (
                <div className="space-y-2 pt-2 border-t border-[#E9D9CD]/70 text-[#39313A]">
                  <div className="font-bold text-xs text-[#7A3F51]">{cepResult.city}</div>
                  
                  {/* Radio Cards Clicáveis de Modalidades de Frete */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* PAC */}
                    <div
                      onClick={() => setQuickViewSelectedOption('pac')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        quickViewSelectedOption === 'pac'
                          ? 'bg-[#FAF0F4] border-[#9C5B6F] ring-2 ring-[#9C5B6F]'
                          : 'bg-white border-[#E9D9CD] hover:border-[#9C5B6F]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          quickViewSelectedOption === 'pac' ? 'border-[#9C5B6F]' : 'border-gray-300'
                        }`}>
                          {quickViewSelectedOption === 'pac' && <span className="w-2 h-2 rounded-full bg-[#9C5B6F]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#39313A]">Correios PAC</div>
                          <div className="text-[11px] text-gray-600">{cepResult.pacDays}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">
                        {cepResult.pac === 0 ? 'GRÁTIS' : formatCurrency(cepResult.pac)}
                      </span>
                    </div>

                    {/* SEDEX */}
                    <div
                      onClick={() => setQuickViewSelectedOption('sedex')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        quickViewSelectedOption === 'sedex'
                          ? 'bg-[#FAF0F4] border-[#9C5B6F] ring-2 ring-[#9C5B6F]'
                          : 'bg-white border-[#E9D9CD] hover:border-[#9C5B6F]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          quickViewSelectedOption === 'sedex' ? 'border-[#9C5B6F]' : 'border-gray-300'
                        }`}>
                          {quickViewSelectedOption === 'sedex' && <span className="w-2 h-2 rounded-full bg-[#9C5B6F]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#39313A]">SEDEX Expresso</div>
                          <div className="text-[11px] text-gray-600">{cepResult.sedexDays}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#7A3F51]">
                        {formatCurrency(cepResult.sedex)}
                      </span>
                    </div>

                    {/* Express */}
                    <div
                      onClick={() => setQuickViewSelectedOption('express')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        quickViewSelectedOption === 'express'
                          ? 'bg-[#FAF0F4] border-[#9C5B6F] ring-2 ring-[#9C5B6F]'
                          : 'bg-white border-[#E9D9CD] hover:border-[#9C5B6F]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          quickViewSelectedOption === 'express' ? 'border-[#9C5B6F]' : 'border-gray-300'
                        }`}>
                          {quickViewSelectedOption === 'express' && <span className="w-2 h-2 rounded-full bg-[#9C5B6F]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#39313A]">Express Bia Makes</div>
                          <div className="text-[11px] text-gray-600">{cepResult.expressDays}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#7A3F51]">
                        {formatCurrency(cepResult.express)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. Informações de Lote, ANVISA e Link Direto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-bia-offwhite border border-bia-nude/80 text-xs space-y-1.5 text-bia-text/80">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Regulamentado ANVISA & 100% Original</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span><strong>Lote:</strong> {quickViewProduct.batch}</span>
                  <span><strong>Validade:</strong> {formatDateShort(quickViewProduct.expiryDate)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-bold text-[#39313A] block">Link Direto c/ Estoque e Frete</span>
                  <span className="text-gray-500 font-mono text-[11px]">/p/{quickViewProduct.sku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopySocialLink(quickViewProduct.sku)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E9D9CD] text-[#7A3F51] text-xs font-bold hover:bg-[#F5DDE5] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedSku === quickViewProduct.sku ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <Link
                    href={`/p/${quickViewProduct.sku}`}
                    className="px-3 py-1.5 rounded-xl bg-[#9C5B6F] text-white text-xs font-bold hover:bg-[#7A3F51] transition-colors"
                  >
                    Abrir
                  </Link>
                </div>
              </div>
            </div>

            {/* 8. Redes Conectadas */}
            <div className="space-y-2 pt-2 border-t border-[#E9D9CD]/60">
              <span className="text-xs font-bold uppercase text-gray-500 block">
                Disponível também nas nossas Redes Conectadas:
              </span>
              <div className="flex flex-wrap gap-2.5">
                {quickViewProduct.socialLinks?.instagramUrl && (
                  <a
                    href={quickViewProduct.socialLinks.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("outbound_click", { target: "instagram", product_sku: quickViewProduct.sku })}
                    className="px-4 py-2 rounded-xl bg-[#FAF0F4] border border-[#E9D9CD] text-[#7A3F51] text-xs font-bold hover:bg-[#F5DDE5] flex items-center gap-1.5 transition-colors"
                  >
                    <Instagram className="w-4 h-4 text-[#9C5B6F]" />
                    <span>Instagram</span>
                  </a>
                )}
                {quickViewProduct.socialLinks?.shopeeUrl && (
                  <a
                    href={quickViewProduct.socialLinks.shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("outbound_click", { target: "shopee", product_sku: quickViewProduct.sku })}
                    className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold hover:bg-orange-100 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Shopee ({quickViewProduct.physicalStock - quickViewProduct.reservedStock} un)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {quickViewProduct.socialLinks?.mercadoLivreUrl && (
                  <a
                    href={quickViewProduct.socialLinks.mercadoLivreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent("outbound_click", { target: "mercado_livre", product_sku: quickViewProduct.sku })}
                    className="px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-900 text-xs font-bold hover:bg-yellow-100 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Mercado Livre</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* 9. Botão Final: Adicionar à Sacola */}
            <div className="pt-2">
              {(() => {
                const activeVar = quickViewVar || activeVariations[quickViewProduct.id] || quickViewProduct.variations?.[0];
                const isQuickOutOfStock = activeVar
                  ? (typeof activeVar.stock === 'number' ? activeVar.stock <= 0 : false)
                  : (quickViewProduct.physicalStock - quickViewProduct.reservedStock <= 0);

                return (
                  <button
                    onClick={(e) => {
                      const added = handleAddWithToast(quickViewProduct, activeVar, e);
                      if (added !== false) {
                        setQuickViewProduct(null);
                      }
                    }}
                    disabled={isQuickOutOfStock}
                    className={`w-full py-4 rounded-full font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2.5 active:scale-98 ${
                      !isQuickOutOfStock
                        ? 'bg-[#9C5B6F] hover:bg-[#7A3F51] text-white hover:shadow-xl cursor-pointer hover:scale-[1.01]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{isQuickOutOfStock ? (activeVar ? 'Tom Esgotado' : 'Produto Esgotado') : 'Adicionar à Minha Sacola'}</span>
                  </button>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* CART DRAWER (SLIDE-OVER) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-bia-nude animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-bia-nude flex items-center justify-between bg-bia-offwhite">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-bia-marsala" />
                <h2 className="font-display text-lg font-bold text-bia-text">
                  Minha Sacola de Beleza
                </h2>
                <span className="text-xs bg-bia-pink text-bia-marsala-dark font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              <button 
                onClick={onCloseCart}
                aria-label="Fechar sacola"
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BARRA DE PROGRESSO DE FRETE GRÁTIS */}
            <div className="px-5 py-3 bg-bia-pink-light/70 border-b border-bia-nude space-y-1.5 shrink-0">
              {subtotal < STORE_CONFIG.freeShippingThreshold ? (
                <>
                  <div className="text-xs text-bia-text font-medium flex items-center justify-between gap-2">
                    <span>
                      Faltam apenas <strong className="text-bia-marsala-dark">{formatCurrency(STORE_CONFIG.freeShippingThreshold - subtotal)}</strong> para você ganhar <strong>Frete Grátis</strong>! 🚚✨
                    </span>
                    <span className="text-[11px] font-bold text-bia-marsala shrink-0">
                      {Math.min(100, Math.round((subtotal / STORE_CONFIG.freeShippingThreshold) * 100))}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white border border-bia-nude overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-bia-rosegold to-bia-marsala transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / STORE_CONFIG.freeShippingThreshold) * 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Parabéns! Você desbloqueou <strong>FRETE GRÁTIS</strong> nesta compra! 🎉</span>
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-bia-rosegold mx-auto opacity-60" />
                  <p className="text-sm font-bold text-bia-text">Sua sacola está vazia.</p>
                  <p className="text-xs text-bia-text/75">Explore nosso catálogo e adicione suas makes favoritas!</p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const price = item.product.promoPrice || item.product.salePrice;
                  const itemAvailStock = item.selectedVariation && typeof item.selectedVariation.stock === "number"
                    ? item.selectedVariation.stock
                    : Math.max(0, item.product.physicalStock - item.product.reservedStock);
                  const isMaxStockReached = item.quantity >= itemAvailStock;

                  return (
                    <div 
                      key={`${item.product.id}-${item.selectedVariation?.id || idx}`}
                      className="flex gap-3 bg-bia-offwhite p-3 rounded-2xl border border-bia-nude/80 items-center"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                        <ProductImage 
                          src={item.product.images[0]} 
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-bia-text truncate">
                          {item.product.name}
                        </h4>
                        {item.selectedVariation && (
                          <div className="text-[11px] text-bia-marsala font-semibold flex items-center gap-1.5 mt-0.5">
                            <span 
                              className="w-3 h-3 rounded-full inline-block ring-1 ring-inset ring-black/15 shrink-0" 
                              style={{ backgroundColor: item.selectedVariation.colorHex }} 
                            />
                            <span>{item.selectedVariation.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-extrabold text-bia-marsala-dark">
                            {formatCurrency(price)}
                          </span>
                          <span className={`text-[11px] font-semibold ${itemAvailStock <= 2 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            ({itemAvailStock} {item.selectedVariation ? 'no tom' : 'disp.'})
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls com trava por tom */}
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-bia-nude">
                        <button 
                          onClick={() => onUpdateCartQuantity(idx, item.quantity - 1)}
                          className="text-gray-500 hover:text-gray-800 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateCartQuantity(idx, item.quantity + 1)}
                          disabled={isMaxStockReached}
                          className={`p-0.5 ${
                            isMaxStockReached 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-gray-500 hover:text-gray-800 cursor-pointer'
                          }`}
                          title={isMaxStockReached ? `Limite de estoque atingido (${itemAvailStock} un)` : 'Adicionar mais 1'}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button 
                        onClick={() => onRemoveFromCart(idx)}
                        className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-[#E9D9CD] bg-[#FAF7F8] space-y-4">
                
                {/* Coupon input */}
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Cupom: BIAMAKE10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-[#E9D9CD] uppercase focus:outline-none focus:border-[#9C5B6F] font-semibold"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-3 py-1.5 bg-[#FAF0F4] border border-[#E9D9CD] text-[#7A3F51] text-xs font-bold rounded-xl hover:bg-[#F5DDE5]"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponMessage && (
                    <div className="text-[10px] text-[#9C5B6F] font-bold">{couponMessage}</div>
                  )}
                </div>

                {/* Cálculo de Frete por CEP na Sacola */}
                <div className="p-3 bg-white rounded-2xl border border-[#E9D9CD] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#7A3F51]">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C69A76]" />
                      <span>Calcular Frete e Prazo</span>
                    </span>
                    {cepInfo && (
                      <span className="text-[10px] font-semibold text-emerald-700">
                        {cepInfo.localidade}/{cepInfo.uf}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="Digite seu CEP (ex: 01310-100)"
                      value={cepInput}
                      onChange={(e) => handleSharedCepInputChange(e.target.value, cart[0]?.product)}
                      className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F8] rounded-xl border border-[#E9D9CD] font-mono focus:outline-none focus:border-[#9C5B6F]"
                    />
                    <button
                      type="button"
                      onClick={() => void runCepLookup(cepInput, cart[0]?.product)}
                      disabled={isCalculatingCep}
                      className="px-3 py-1.5 bg-[#FAF0F4] border border-[#E9D9CD] text-[#7A3F51] text-xs font-bold rounded-xl hover:bg-[#F5DDE5] disabled:opacity-60 cursor-pointer"
                    >
                      {isCalculatingCep ? '...' : 'Calcular'}
                    </button>
                  </div>

                  {cepError && (
                    <p className="text-[10px] text-rose-600 font-semibold">{cepError}</p>
                  )}

                  {cartShippingQuotes.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {cartShippingQuotes.map((quote) => {
                        const isSelected = selectedCartQuote?.carrierId === quote.carrierId;
                        return (
                          <button
                            key={quote.carrierId}
                            type="button"
                            onClick={() => setSelectedCartCarrierId(quote.carrierId)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#FAF0F4] border-[#9C5B6F] text-[#7A3F51] font-bold shadow-xs'
                                : 'bg-[#FAF7F8] border-[#E9D9CD]/70 text-[#39313A] hover:border-[#C69A76]'
                            }`}
                          >
                            <span className="truncate text-left">
                              {quote.carrierName} <span className="text-[10px] opacity-75">({quote.deliveryDays})</span>
                            </span>
                            <span className={`font-extrabold shrink-0 ml-2 ${quote.customerPrice === 0 ? 'text-emerald-700' : ''}`}>
                              {quote.customerPrice === 0 ? 'GRÁTIS' : formatCurrency(quote.customerPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#39313A]/65 leading-snug">
                      {subtotal >= STORE_CONFIG.freeShippingThreshold || allItemsHaveFreeShipping
                        ? 'Frete grátis elegível! Informe seu CEP para escolher a transportadora e o prazo.'
                        : 'Informe seu CEP acima para calcular o frete real antes de fechar o pedido.'}
                    </p>
                  )}
                </div>

                {/* Subtotals */}
                <div className="space-y-1.5 text-xs text-[#39313A]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-[#9C5B6F] font-bold">
                      <span>Desconto (10%):</span>
                      <span>-{formatCurrency(discountValue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-[#C69A76]" />
                      <span>Frete{selectedCartQuote ? ` (${selectedCartQuote.carrierName})` : ''}:</span>
                    </span>
                    {selectedCartQuote ? (
                      <span className={shipping === 0 ? "text-emerald-700 font-bold" : "font-semibold"}>
                        {shipping === 0 ? "GRÁTIS" : formatCurrency(shipping)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-500">
                        A calcular pelo CEP
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-[#7A3F51] pt-2 border-t border-[#E9D9CD]">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] hover:opacity-95 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Finalizar Compra Segura (PIX ou Cartão)</span>
                  </button>

                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comprar Direto no WhatsApp Oficial</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#E9D9CD] mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-[#C69A76]">
                  <Image src="/logo.jpg" alt="Logo Bia Make" fill className="object-cover" />
                </div>
                <span className="font-display text-lg font-bold text-[#7A3F51]">Bia Make</span>
              </div>
              <p className="text-xs text-[#39313A]/70 leading-relaxed">
                Cosméticos femininos criados para exaltar a autoestima, confiança e o charme de cada mulher.
              </p>
              <div className="text-xs font-bold text-[#9C5B6F]">
                Instagram: {STORE_CONFIG.instagramHandle}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C69A76] mb-3">Categorias</h4>
              <ul className="space-y-2 text-xs text-[#39313A]/80 font-medium">
                <li>Bases Líquidas Matte HD</li>
                <li>Batons & Lip Gloss Velvet</li>
                <li>Paletas de Sombras Glamour</li>
                <li>Pincéis & Acessórios Master</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C69A76] mb-3">Atendimento</h4>
              <ul className="space-y-2 text-xs text-[#39313A]/80 font-medium">
                <li>{STORE_CONFIG.businessHours}</li>
                <li>WhatsApp: {STORE_CONFIG.whatsappDisplay}</li>
                <li>E-mail: {STORE_CONFIG.supportEmail}</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#C69A76] mb-3">Segurança & Gestão</h4>
              <div className="space-y-2.5 text-xs text-[#39313A]/70">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Ambiente Criptografado SSL</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Truck className="w-4 h-4 text-[#C69A76]" />
                  <span>Rastreamento em Tempo Real</span>
                </div>
                <div className="pt-2">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-[#9C5B6F] transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Acesso Restrito (Admin CRM/ERP)</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL DE CHECKOUT TRANSPARENTE (PIX / CARTÃO) & REGISTRO NO CRM */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        subtotal={subtotal}
        shippingAmount={shipping}
        discountAmount={discountValue}
        total={total}
        initialCep={cepInput}
        initialCepInfo={cepInfo}
        initialCarrierId={selectedCartQuote?.carrierId || selectedCartCarrierId}
      />

      {/* ANIMAÇÃO DE VOO DO PRODUTO PARA A SACOLA (FLY TO CART) */}
      {flyingItem && (
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: `${flyingItem.startX}px`,
            top: `${flyingItem.startY}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-2 border-white ring-2 ring-bia-marsala bg-white"
            style={{
              animation: 'flyParabola 0.8s cubic-bezier(0.2, 0.8, 0.25, 1) forwards',
              ['--fly-dx' as string]: `${flyingItem.targetX - flyingItem.startX}px`,
              ['--fly-dy' as string]: `${flyingItem.targetY - flyingItem.startY}px`,
            }}
          >
            <ProductImage
              src={flyingItem.image}
              alt="Adicionando à sacola"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* MODAL MODERNO E ELEGANTE DE CONFIRMAÇÃO DE ITEM ADICIONADO */}
      {addedSuccessModal && (
        <div 
          onClick={() => setAddedSuccessModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl border border-[#E9D9CD] animate-in zoom-in-95 duration-200 space-y-5"
          >
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setAddedSuccessModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ícone de Sucesso e Título */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Adicionado com Sucesso!
                </span>
                <h3 className="font-display text-lg font-bold text-[#39313A]">
                  Item colocado na sua sacola
                </h3>
              </div>
            </div>

            {/* Card com Detalhes do Produto */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/80">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#E9D9CD] shrink-0">
                <ProductImage
                  src={addedSuccessModal.product.images?.[0] || "/logo.jpg"}
                  alt={addedSuccessModal.product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-[#39313A] line-clamp-1">
                  {addedSuccessModal.product.name}
                </h4>
                {addedSuccessModal.variation && (
                  <p className="text-[11px] font-semibold text-[#9C5B6F] mt-0.5">
                    Tom: {addedSuccessModal.variation.name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-extrabold text-[#7A3F51]">
                    {formatCurrency(addedSuccessModal.product.promoPrice || addedSuccessModal.product.salePrice)}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Estoque Garantido
                  </span>
                </div>
              </div>
            </div>

            {/* Resumo da Sacola */}
            <div className="flex items-center justify-between text-xs px-2 text-[#39313A]/80">
              <span>Itens na sacola: <strong>{cart.reduce((a, b) => a + b.quantity, 0)}</strong></span>
              <span>Subtotal: <strong className="text-[#7A3F51]">{formatCurrency(subtotal)}</strong></span>
            </div>

            {/* Botões de Ação */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAddedSuccessModal(null)}
                className="w-full py-3 rounded-full border border-[#E9D9CD] bg-[#FAF7F8] hover:bg-[#F5DDE5]/40 text-[#7A3F51] text-xs font-bold transition-all cursor-pointer text-center"
              >
                Continuar Comprando
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddedSuccessModal(null);
                  onOpenCart?.();
                }}
                className="w-full py-3 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ver Sacola</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
