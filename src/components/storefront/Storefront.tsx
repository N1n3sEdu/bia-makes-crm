"use client";

import React, { useState } from "react";
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
  X, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Truck, 
  MessageCircle,
  Eye,
  Award,
  Instagram,
  Share2,
  ExternalLink,
  PackageCheck,
  MapPin,
  Lock,
  Copy
} from "lucide-react";
import { Product, ProductCategory, ProductVariation } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { CartItem } from "@/context/BiaMakesContext";

interface StorefrontProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product, variation?: ProductVariation) => void;
  onUpdateCartQuantity: (index: number, quantity: number) => void;
  onRemoveFromCart: (index: number) => void;
  isCartOpen: boolean;
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
  onCloseCart,
  selectedCategory: externalSelectedCategory,
  onSelectCategory: externalOnSelectCategory,
}: StorefrontProps) {
  const [internalCategory, setInternalCategory] = useState<ProductCategory | 'Todos'>('Todos');
  const selectedCategory = externalSelectedCategory !== undefined ? externalSelectedCategory : internalCategory;
  const setSelectedCategory = externalOnSelectCategory || setInternalCategory;
  const [searchQuery, setSearchQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeVariations, setActiveVariations] = useState<Record<string, ProductVariation>>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string>('');

  // CEP Calculator state inside Quick View / Storefront
  const [cepInput, setCepInput] = useState('');
  const [cepResult, setCepResult] = useState<{
    pac: number;
    sedex: number;
    express: number;
    city: string;
  } | null>(null);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  // Handle variation selection
  const handleSelectVariation = (productId: string, variation: ProductVariation) => {
    setActiveVariations(prev => ({ ...prev, [productId]: variation }));
  };

  // Calculate CEP Shipping
  const handleCalculateCep = (product: Product) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length < 8) {
      alert('Digite um CEP válido com 8 dígitos (Ex: 01310-100).');
      return;
    }
    const base = product.freeShipping ? 0 : (product.shippingValue || 12.90);
    setCepResult({
      pac: base,
      sedex: base === 0 ? 9.90 : base + 7.50,
      express: base === 0 ? 14.90 : base + 12.00,
      city: cleanCep.startsWith('0') || cleanCep.startsWith('1') ? 'São Paulo / Região (2 a 3 dias úteis)' : 'Entrega Nacional Correios / Jadlog (3 a 6 dias úteis)'
    });
  };

  // Copy shareable social link with embedded stock & shipping
  const handleCopySocialLink = (sku: string) => {
    const url = `${window.location.origin}/p/${sku}`;
    navigator.clipboard.writeText(url);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2500);
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart totals
  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.promoPrice || item.product.salePrice;
    return acc + price * item.quantity;
  }, 0);

  const discountValue = (subtotal * appliedDiscount) / 100;
  // Calculate cart shipping based on product embedded shipping values (or free if subtotal >= 149)
  const rawCartShipping = cart.reduce((acc, item) => {
    if (item.product.freeShipping) return acc;
    return Math.max(acc, item.product.shippingValue || 12.90);
  }, 0);
  const shipping = subtotal >= 149 || subtotal === 0 ? 0 : rawCartShipping;
  const total = subtotal - discountValue + shipping;

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
    
    let text = `Olá Bia Makes! 💕 Gostaria de finalizar meu pedido:\n\n`;
    cart.forEach((item, idx) => {
      const price = item.product.promoPrice || item.product.salePrice;
      const avail = item.product.physicalStock - item.product.reservedStock;
      const variationText = item.selectedVariation ? ` (${item.selectedVariation.name})` : '';
      text += `${idx + 1}. *${item.product.name}*${variationText} - ${item.quantity}x ${formatCurrency(price)} [Estoque: ${avail} un]\n`;
    });
    text += `\n*Subtotal:* ${formatCurrency(subtotal)}`;
    if (appliedDiscount > 0) text += `\n*Desconto:* -${formatCurrency(discountValue)} (BIAMAKE10)`;
    text += `\n*Frete Calculado:* ${shipping === 0 ? 'GRÁTIS' : formatCurrency(shipping)}`;
    text += `\n*TOTAL:* ${formatCurrency(total)}\n\nPor favor, confirmem o envio e a chave PIX! ✨`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=5511999999999&text=${encoded}`, '_blank');
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
                Realce a sua beleza com <span className="text-[#9C5B6F] underline decoration-[#C69A76]/40 decoration-wavy underline-offset-8">sofisticação</span> & elegância.
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
                  href="https://instagram.com/biamakeoficial_" 
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

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C5B6F]" />
              <input 
                type="text"
                placeholder="Buscar base, batom, paleta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white rounded-full border border-[#E9D9CD] focus:outline-none focus:ring-2 focus:ring-[#9C5B6F]/40 focus:border-[#9C5B6F] shadow-sm transition-all font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isSelected 
                      ? 'bg-[#9C5B6F] text-white shadow-md' 
                      : 'bg-white text-[#39313A] border border-[#E9D9CD] hover:bg-[#F5DDE5]/40 hover:border-[#9C5B6F]/40'
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
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E9D9CD] p-8">
            <Sparkles className="w-10 h-10 text-[#C69A76] mx-auto mb-3" />
            <h3 className="font-display text-xl font-bold text-[#39313A]">Nenhum produto encontrado</h3>
            <p className="text-xs text-[#39313A]/70 mt-1">Tente ajustar a sua busca ou selecione outra categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const selectedVar = activeVariations[product.id] || product.variations[0];
              const availableStock = product.physicalStock - product.reservedStock;
              const hasDiscount = Boolean(product.promoPrice && product.promoPrice < product.salePrice);
              const price = product.promoPrice || product.salePrice;
              const isFreeShipping = product.freeShipping || product.shippingValue === 0;

              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-3xl border border-[#E9D9CD]/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C69A76]/60 transition-all duration-300 flex flex-col group"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] bg-[#FAF7F8] overflow-hidden">
                    <Image 
                      src={product.images[0] || '/logo.jpg'} 
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

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

                    {/* Quick View & Share Link Buttons */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopySocialLink(product.sku)}
                        className="p-2.5 bg-white/95 hover:bg-white text-[#7A3F51] rounded-full shadow-md transition-all"
                        title="Copiar Link para Redes Sociais com Estoque e Frete Embutido"
                      >
                        {copiedSku === product.sku ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4 text-[#9C5B6F]" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setQuickViewProduct(product);
                          setCepResult(null);
                        }}
                        className="p-2.5 bg-white/95 hover:bg-white text-[#39313A] rounded-full shadow-md transition-all"
                        title="Ver Detalhes, Simular CEP e Redes Vinculadas"
                      >
                        <Eye className="w-4 h-4 text-[#9C5B6F]" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Category & Rating */}
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#C69A76] font-bold uppercase tracking-wider text-[10px]">
                          {product.category} • SKU: {product.sku}
                        </span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{product.rating}</span>
                          <span className="text-[#39313A]/50 text-[10px]">({product.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Title */}
                      <Link href={`/p/${product.sku}`}>
                        <h3 className="font-display text-lg font-bold text-[#39313A] line-clamp-1 group-hover:text-[#9C5B6F] transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-[#39313A]/70 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Swatches / Variations Selector */}
                      {product.variations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#E9D9CD]/50">
                          <div className="text-[11px] font-semibold text-[#39313A]/80 mb-1.5 flex justify-between">
                            <span>Tom / Variação:</span>
                            <span className="text-[#9C5B6F] font-bold">{selectedVar?.name} ({selectedVar?.stock} un)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {product.variations.map((v) => {
                              const isCurrent = selectedVar?.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => handleSelectVariation(product.id, v)}
                                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                    isCurrent ? 'ring-2 ring-[#9C5B6F] scale-110 border-white' : 'border-gray-200 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: v.colorHex }}
                                  title={`${v.name} — ${v.stock} em estoque`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* EMBEDDED STOCK & SHIPPING VALUE BOX */}
                      <div className="mt-3 p-2.5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/70 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[#39313A]/80 font-semibold">
                            <PackageCheck className="w-3.5 h-3.5 text-[#9C5B6F]" />
                            Estoque Central:
                          </span>
                          <span className="font-bold text-emerald-700">
                            {availableStock} unidades prontas
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[#39313A]/80 font-semibold">
                            <Truck className="w-3.5 h-3.5 text-[#C69A76]" />
                            Valor do Frete:
                          </span>
                          <span className={`font-bold ${isFreeShipping ? 'text-emerald-700' : 'text-[#7A3F51]'}`}>
                            {isFreeShipping ? 'FRETE GRÁTIS' : `${formatCurrency(product.shippingValue)} (Fixo/Base)`}
                          </span>
                        </div>

                        {/* Linked Social Networks & Marketplaces Bar */}
                        <div className="pt-1.5 border-t border-[#E9D9CD]/50 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-gray-500">
                            Redes vinculadas:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {product.socialLinks?.instagramUrl && (
                              <a
                                href={product.socialLinks.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md bg-[#F5DDE5] text-[#7A3F51] text-[9px] font-bold hover:bg-[#9C5B6F] hover:text-white transition-colors"
                                title="Ver no Instagram @biamakeoficial_"
                              >
                                Insta
                              </a>
                            )}
                            {product.socialLinks?.shopeeUrl && (
                              <a
                                href={product.socialLinks.shopeeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[9px] font-bold hover:bg-orange-500 hover:text-white transition-colors"
                                title="Comprar na Shopee com estoque sincronizado"
                              >
                                Shopee
                              </a>
                            )}
                            {product.socialLinks?.mercadoLivreUrl && (
                              <a
                                href={product.socialLinks.mercadoLivreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-900 text-[9px] font-bold hover:bg-yellow-400 transition-colors"
                                title="Comprar no Mercado Livre"
                              >
                                ML
                              </a>
                            )}
                            {product.socialLinks?.tiktokUrl && (
                              <a
                                href={product.socialLinks.tiktokUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-900 text-[9px] font-bold hover:bg-pink-600 hover:text-white transition-colors"
                                title="Ver no TikTok Shop"
                              >
                                TikTok
                              </a>
                            )}
                            <Link
                              href={`/p/${product.sku}`}
                              className="px-2 py-0.5 rounded-md bg-[#EDE5F3] text-[#7A3F51] text-[9px] font-bold hover:bg-[#7A3F51] hover:text-white transition-colors flex items-center gap-0.5"
                              title="Abrir Página Exclusiva de Rede Social (Estoque + Frete Embutido)"
                            >
                              <span>Link Bio</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-3 border-t border-[#E9D9CD]/50 flex items-center justify-between">
                      <div>
                        {hasDiscount && (
                          <span className="text-xs text-gray-400 line-through block font-medium">
                            {formatCurrency(product.salePrice)}
                          </span>
                        )}
                        <span className="text-xl font-extrabold text-[#7A3F51]">
                          {formatCurrency(price)}
                        </span>
                        <div className="text-[10px] text-[#39313A]/60 font-medium">
                          ou 3x de {formatCurrency(price / 3)} sem juros
                        </div>
                      </div>

                      <button
                        onClick={() => onAddToCart(product, selectedVar)}
                        disabled={availableStock <= 0}
                        className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                          availableStock > 0
                            ? 'bg-[#9C5B6F] hover:bg-[#7A3F51] text-white shadow-md shadow-[#9C5B6F]/20'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Comprar</span>
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
                Todos os produtos da <strong>Bia Makes</strong> possuem link direto para o Instagram (<code>@biamakeoficial_</code>), Shopee, Mercado Livre e TikTok Shop, mantendo o <strong>estoque real embutido</strong> e o <strong>cálculo transparente de frete</strong> em qualquer canal.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap gap-2.5 justify-start lg:justify-end">
              <a
                href="https://instagram.com/biamakeoficial_"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-2xl bg-[#9C5B6F] text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-[#7A3F51] transition-all"
              >
                <Instagram className="w-4 h-4" />
                <span>Instagram Oficial</span>
              </a>
              <a
                href="https://shopee.com.br"
                target="_blank"
                rel="noopener noreferrer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl border border-[#E9D9CD] overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF7F8] border border-[#E9D9CD]">
                  <Image 
                    src={quickViewProduct.images[0] || '/logo.jpg'} 
                    alt={quickViewProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Direct Social Share Link Box */}
                <div className="p-3 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] flex items-center justify-between">
                  <div className="text-[11px]">
                    <span className="font-bold text-[#39313A] block">Link Direto c/ Estoque e Frete</span>
                    <span className="text-gray-500 font-mono text-[10px]">/p/{quickViewProduct.sku}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopySocialLink(quickViewProduct.sku)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E9D9CD] text-[#7A3F51] text-[10px] font-bold hover:bg-[#F5DDE5] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedSku === quickViewProduct.sku ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                    <Link
                      href={`/p/${quickViewProduct.sku}`}
                      className="px-2.5 py-1.5 rounded-xl bg-[#9C5B6F] text-white text-[10px] font-bold hover:bg-[#7A3F51]"
                    >
                      Abrir
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#C69A76] uppercase tracking-wider">
                    {quickViewProduct.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {quickViewProduct.physicalStock - quickViewProduct.reservedStock} un. em estoque
                  </span>
                </div>

                <h3 className="font-display text-2xl font-bold text-[#39313A]">
                  {quickViewProduct.name}
                </h3>

                <p className="text-xs text-[#39313A]/80 leading-relaxed">
                  {quickViewProduct.description}
                </p>

                <div className="flex items-baseline justify-between bg-[#FAF0F4] p-3 rounded-2xl border border-[#E9D9CD]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#7A3F51] block">Valor Promocional</span>
                    <span className="text-2xl font-extrabold text-[#7A3F51]">
                      {formatCurrency(quickViewProduct.promoPrice || quickViewProduct.salePrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#C69A76] block">Frete Base Embutido</span>
                    <span className="text-xs font-bold text-emerald-700">
                      {quickViewProduct.freeShipping || quickViewProduct.shippingValue === 0
                        ? 'FRETE GRÁTIS'
                        : formatCurrency(quickViewProduct.shippingValue)}
                    </span>
                  </div>
                </div>

                {/* Embedded CEP Shipping Simulator */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] space-y-2.5">
                  <label className="block text-[11px] font-bold text-[#39313A] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9C5B6F]" />
                    <span>Calcular Frete e Prazo no Produto (CEP):</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite seu CEP (ex: 01310-100)"
                      value={cepInput}
                      onChange={(e) => setCepInput(e.target.value)}
                      maxLength={9}
                      className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                    <button
                      type="button"
                      onClick={() => handleCalculateCep(quickViewProduct)}
                      className="px-3.5 py-1.5 bg-[#9C5B6F] text-white text-xs font-bold rounded-xl hover:bg-[#7A3F51]"
                    >
                      Calcular
                    </button>
                  </div>
                  {cepResult && (
                    <div className="text-[11px] space-y-1 pt-1 border-t border-[#E9D9CD]/60 text-[#39313A]">
                      <div className="font-semibold text-[#7A3F51]">{cepResult.city}</div>
                      <div className="flex justify-between">
                        <span>• Correios PAC (Econômico):</span>
                        <strong className="text-emerald-700">
                          {cepResult.pac === 0 ? 'GRÁTIS' : formatCurrency(cepResult.pac)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>• SEDEX Rápido (1-2 dias):</span>
                        <strong>{formatCurrency(cepResult.sedex)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>• Motoboy / Express Bia Makes:</span>
                        <strong>{formatCurrency(cepResult.express)}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Linked Networks in Modal */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">
                    Disponível também nas nossas Redes Conectadas:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickViewProduct.socialLinks?.instagramUrl && (
                      <a
                        href={quickViewProduct.socialLinks.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-[#FAF0F4] border border-[#E9D9CD] text-[#7A3F51] text-[11px] font-bold hover:bg-[#F5DDE5] flex items-center gap-1"
                      >
                        <Instagram className="w-3.5 h-3.5 text-[#9C5B6F]" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {quickViewProduct.socialLinks?.shopeeUrl && (
                      <a
                        href={quickViewProduct.socialLinks.shopeeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-[11px] font-bold hover:bg-orange-100 flex items-center gap-1"
                      >
                        <span>Shopee ({quickViewProduct.physicalStock - quickViewProduct.reservedStock} un)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {quickViewProduct.socialLinks?.mercadoLivreUrl && (
                      <a
                        href={quickViewProduct.socialLinks.mercadoLivreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-yellow-50 border border-yellow-300 text-yellow-900 text-[11px] font-bold hover:bg-yellow-100 flex items-center gap-1"
                      >
                        <span>Mercado Livre</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(quickViewProduct, quickViewProduct.variations?.[0]);
                    setQuickViewProduct(null);
                  }}
                  className="w-full py-3 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar à Minha Sacola</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER (SLIDE-OVER) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#E9D9CD] animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-[#E9D9CD] flex items-center justify-between bg-[#FAF7F8]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#9C5B6F]" />
                <h2 className="font-display text-lg font-bold text-[#39313A]">
                  Minha Sacola de Beleza
                </h2>
                <span className="text-xs bg-[#F5DDE5] text-[#7A3F51] font-bold px-2 py-0.5 rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              <button 
                onClick={onCloseCart}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-[#C69A76] mx-auto opacity-50" />
                  <p className="text-sm font-bold text-[#39313A]">Sua sacola está vazia.</p>
                  <p className="text-xs text-[#39313A]/60">Explore nosso catálogo e adicione suas makes favoritas!</p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const price = item.product.promoPrice || item.product.salePrice;
                  const avail = item.product.physicalStock - item.product.reservedStock;
                  return (
                    <div 
                      key={`${item.product.id}-${item.selectedVariation?.id || idx}`}
                      className="flex gap-3 bg-[#FAF7F8] p-3 rounded-2xl border border-[#E9D9CD]/60 items-center"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                        <Image 
                          src={item.product.images[0] || '/logo.jpg'} 
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#39313A] truncate">
                          {item.product.name}
                        </h4>
                        {item.selectedVariation && (
                          <div className="text-[10px] text-[#9C5B6F] font-semibold flex items-center gap-1.5 mt-0.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block border" 
                              style={{ backgroundColor: item.selectedVariation.colorHex }} 
                            />
                            <span>{item.selectedVariation.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-extrabold text-[#7A3F51]">
                            {formatCurrency(price)}
                          </span>
                          <span className="text-[9px] text-emerald-700 font-semibold">
                            ({avail} disp.)
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-[#E9D9CD]">
                        <button 
                          onClick={() => onUpdateCartQuantity(idx, item.quantity - 1)}
                          className="text-gray-500 hover:text-gray-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateCartQuantity(idx, item.quantity + 1)}
                          className="text-gray-500 hover:text-gray-800"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button 
                        onClick={() => onRemoveFromCart(idx)}
                        className="text-gray-400 hover:text-rose-600 p-1"
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
                      <span>Frete Embutido:</span>
                    </span>
                    <span className={shipping === 0 ? "text-emerald-700 font-bold" : "font-semibold"}>
                      {shipping === 0 ? "GRÁTIS" : formatCurrency(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-[#7A3F51] pt-2 border-t border-[#E9D9CD]">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Finalizar via WhatsApp Oficial</span>
                  </button>

                  <button
                    onClick={() => alert(`Pedido de ${formatCurrency(total)} pronto para pagamento PIX ou Cartão!`)}
                    className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] hover:opacity-95 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Pagamento Seguro / PIX</span>
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
                Instagram: @biamakeoficial_
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
                <li>Segunda a Sexta: 09h às 18h</li>
                <li>Sábado: 09h às 13h</li>
                <li>WhatsApp: (11) 99999-9999</li>
                <li>E-mail: contato@biamake.com.br</li>
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

    </div>
  );
}
