"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  PackageCheck, 
  Truck, 
  ShoppingBag, 
  MessageCircle, 
  Instagram, 
  ExternalLink, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Star,
  Copy,
  Check
} from "lucide-react";
import { useBiaMakes } from "@/context/BiaMakesContext";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { ProductVariation } from "@/types";
import { STORE_CONFIG } from "@/lib/data";
import { CheckoutModal } from "@/components/storefront/CheckoutModal";

export default function ProductSocialEmbedPage() {
  const params = useParams();
  const router = useRouter();
  const skuParam = decodeURIComponent((params?.sku as string) || "");

  const { products, addToCart } = useBiaMakes();

  const product = products.find(
    (p) => p.sku.toLowerCase() === skuParam.toLowerCase() || p.id === skuParam
  ) || products[0];

  const [selectedVar, setSelectedVar] = useState<ProductVariation | undefined>(
    product?.variations?.[0]
  );
  const [cep, setCep] = useState("");
  const [shippingQuote, setShippingQuote] = useState<{
    pac: number;
    sedex: number;
    express: number;
    region: string;
  } | null>(null);
  const [selectedShippingOption, setSelectedShippingOption] = useState<"pac" | "sedex" | "express">("pac");
  const [copied, setCopied] = useState(false);
  const [isDirectCheckoutOpen, setIsDirectCheckoutOpen] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F8] p-6">
        <div className="bg-white p-8 rounded-3xl border border-[#E9D9CD] text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-[#39313A]">Produto não encontrado</h1>
          <Link href="/" className="inline-block px-6 py-2.5 rounded-full bg-[#9C5B6F] text-white text-xs font-bold">
            Ir para a Loja Virtual
          </Link>
        </div>
      </div>
    );
  }

  const availableStock = product.physicalStock - product.reservedStock;
  const currentVarStock = selectedVar && typeof selectedVar.stock === "number"
    ? selectedVar.stock
    : availableStock;
  const isVarOutOfStock = selectedVar
    ? (typeof selectedVar.stock === "number" ? selectedVar.stock <= 0 : false)
    : availableStock <= 0;

  const price = product.promoPrice || product.salePrice;
  const isFreeShip = product.freeShipping || product.shippingValue === 0;

  // Valor e nome da modalidade de frete atualmente selecionada
  const activeShippingValue = shippingQuote
    ? shippingQuote[selectedShippingOption]
    : isFreeShip
    ? 0
    : product.shippingValue || 0;

  const activeShippingName = shippingQuote
    ? selectedShippingOption === "sedex"
      ? "SEDEX Expresso (1-2 dias)"
      : selectedShippingOption === "express"
      ? "Motoboy / Express Bia Makes (24h)"
      : "Correios PAC (Econômico)"
    : isFreeShip
    ? "Frete Base (Grátis)"
    : "Frete Fixo Padrão";

  const totalWithShip = price + activeShippingValue;

  const handleCalculateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cep.replace(/\D/g, "");
    if (clean.length < 8) {
      alert("Informe um CEP válido com 8 dígitos.");
      return;
    }
    const base = isFreeShip ? 0 : product.shippingValue || 12.90;
    setShippingQuote({
      pac: base,
      sedex: base === 0 ? 9.90 : base + 7.50,
      express: base === 0 ? 14.90 : base + 12.00,
      region:
        clean.startsWith("0") || clean.startsWith("1")
          ? "Sudeste / Capital (Prazo: 1 a 3 dias úteis)"
          : "Entrega Nacional Segurada (Prazo: 3 a 6 dias úteis)",
    });
  };

  const handleDirectWhatsApp = () => {
    if (isVarOutOfStock) {
      alert("O tom selecionado está esgotado no momento.");
      return;
    }

    const shadeText = selectedVar ? ` (Tom: ${selectedVar.name})` : "";
    const msg =
      `Olá Bia Makes! 💕 Vi o link exclusivo das redes sociais e quero comprar:\n\n` +
      `💄 *${product.name}*${shadeText}\n` +
      `📦 *SKU:* ${product.sku} (Estoque do tom: ${currentVarStock} un)\n` +
      `💰 *Valor do Produto:* ${formatCurrency(price)}\n` +
      `🚚 *Modalidade de Frete Selecionada:* ${activeShippingName} (${activeShippingValue === 0 ? "FRETE GRÁTIS" : formatCurrency(activeShippingValue)})\n` +
      `✨ *Total c/ Frete:* ${formatCurrency(totalWithShip)}\n\n` +
      `Podem me enviar a chave PIX para envio imediato?`;

    window.open(
      `https://api.whatsapp.com/send?phone=${STORE_CONFIG.whatsappNumber}&text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const handleCopyCurrentUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF0F4] via-[#FAF7F8] to-[#FAF7F8] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-md px-5 py-3 rounded-full border border-[#E9D9CD] shadow-sm">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-[#7A3F51] hover:text-[#9C5B6F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Catálogo Completo</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-[#C69A76]">
              <Image src="/logo.jpg" alt="Bia Make" fill className="object-cover" />
            </div>
            <span className="font-display text-sm font-extrabold text-[#7A3F51]">
              Bia MAKE
            </span>
          </div>

          <button
            onClick={handleCopyCurrentUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF0F4] hover:bg-[#F5DDE5] text-[#7A3F51] border border-[#E9D9CD] text-[11px] font-bold transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#9C5B6F]" />}
            <span>{copied ? "Link Copiado!" : "Compartilhar Link"}</span>
          </button>
        </div>

        {/* Main Embedded Product Card */}
        <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-xl overflow-hidden p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left Image & Badges (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#FAF7F8] border border-[#E9D9CD]">
                <Image
                  src={product.images[0] || "/logo.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-[#9C5B6F] text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                    Vitrine Oficial Redes Sociais
                  </span>
                </div>
              </div>

              {/* Authenticity & Batch Info */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]/70 text-[11px] space-y-1 text-[#39313A]/80">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Produto 100% Original & Regulamentado ANVISA</span>
                </div>
                <div>
                  <strong>SKU Oficial:</strong> {product.sku} • <strong>Lote:</strong> {product.batch}
                </div>
                <div>
                  <strong>Validade do Lote:</strong> {formatDateShort(product.expiryDate)}
                </div>
              </div>
            </div>

            {/* Right Product Details, Embedded Stock, Freight & Social Channels (7 cols) */}
            <div className="md:col-span-7 space-y-5">
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C69A76]">
                    {product.category} • {product.brand}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-gray-400">({product.reviewsCount} avaliações)</span>
                  </div>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#39313A] mt-1">
                  {product.name}
                </h1>

                <p className="text-xs sm:text-sm text-[#39313A]/75 mt-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* EMBEDDED LIVE STOCK & EMBEDDED FREIGHT HIGHLIGHT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-emerald-800">
                      Estoque Embutido (Tempo Real)
                    </div>
                    <div className="text-base font-extrabold text-emerald-900">
                      {availableStock} unidades prontas
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF0F4] border border-[#E9D9CD] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5DDE5] flex items-center justify-center text-[#9C5B6F] shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[#7A3F51]">
                      Valor de Frete Embutido
                    </div>
                    <div className="text-base font-extrabold text-[#7A3F51]">
                      {isFreeShip ? "FRETE GRÁTIS" : formatCurrency(product.shippingValue)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shade / Variation Selector */}
              {product.variations?.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#39313A]">Escolha o Tom / Variação:</span>
                    <span className={`font-bold ${isVarOutOfStock ? "text-rose-600" : "text-[#9C5B6F]"}`}>
                      {selectedVar?.name} ({isVarOutOfStock ? "ESGOTADO" : `${currentVarStock} un. neste tom`})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variations.map((v) => {
                      const active = selectedVar?.id === v.id;
                      const isOutOfStock = v.stock <= 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVar(v)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                            active
                              ? "bg-[#9C5B6F] text-white border-[#9C5B6F] shadow-sm"
                              : "bg-white text-[#39313A] border-[#E9D9CD] hover:border-[#9C5B6F]"
                          } ${isOutOfStock ? "opacity-50" : ""}`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/60 shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <span>{v.name}</span>
                          {isOutOfStock && <span className="text-[10px] text-rose-300 font-extrabold">(Esgotado)</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price + Total with Embedded Freight & Real-Time Shipping Selection */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#C69A76]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  {product.promoPrice && (
                    <span className="text-xs text-gray-400 line-through block font-medium">
                      De {formatCurrency(product.salePrice)}
                    </span>
                  )}
                  <div className="text-3xl font-extrabold text-[#7A3F51]">
                    {formatCurrency(price)}
                  </div>
                  <div className="text-[11px] text-gray-600 font-medium mt-0.5 space-y-0.5">
                    <div>
                      Frete Selecionado:{" "}
                      <span className="font-bold text-[#7A3F51]">{activeShippingName}</span> (
                      <span className="text-emerald-700 font-bold">
                        {activeShippingValue === 0 ? "GRÁTIS" : formatCurrency(activeShippingValue)}
                      </span>
                      )
                    </div>
                    <div>
                      Total com Frete:{" "}
                      <strong className="text-base text-[#39313A]">
                        {formatCurrency(totalWithShip)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setIsDirectCheckoutOpen(true)}
                    disabled={isVarOutOfStock}
                    className={`px-5 py-3 rounded-full text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all ${
                      !isVarOutOfStock
                        ? "bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] hover:opacity-95 text-white cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{isVarOutOfStock ? "Tom Esgotado" : "Comprar c/ PIX ou Cartão"}</span>
                  </button>

                  <button
                    onClick={handleDirectWhatsApp}
                    disabled={isVarOutOfStock}
                    className={`px-4 py-3 rounded-full text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all ${
                      !isVarOutOfStock
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      addToCart(product, selectedVar);
                      router.push("/");
                    }}
                    disabled={isVarOutOfStock}
                    className={`px-4 py-3 rounded-full text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all ${
                      !isVarOutOfStock
                        ? "bg-white border border-[#E9D9CD] text-[#7A3F51] hover:bg-[#FAF7F8] cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Sacola</span>
                  </button>
                </div>
              </div>

              {/* CEP Calculator com Opções Selecionáveis Clicáveis */}
              <form onSubmit={handleCalculateShipping} className="p-4 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] space-y-3">
                <label className="text-xs font-bold text-[#39313A] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#9C5B6F]" />
                  <span>Simular Frete e Escolher Modalidade de Envio:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite seu CEP (ex: 01310-100)"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    maxLength={9}
                    className="flex-1 px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#7A3F51] text-white text-xs font-bold hover:bg-[#9C5B6F] cursor-pointer"
                  >
                    Calcular Frete
                  </button>
                </div>
                {shippingQuote && (
                  <div className="pt-2 border-t border-[#E9D9CD] space-y-2">
                    <div className="font-bold text-xs text-[#7A3F51]">{shippingQuote.region}</div>
                    
                    {/* Radio Cards Clicáveis */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* PAC */}
                      <div
                        onClick={() => setSelectedShippingOption("pac")}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedShippingOption === "pac"
                            ? "bg-[#FAF0F4] border-[#9C5B6F] ring-2 ring-[#9C5B6F]"
                            : "bg-white border-[#E9D9CD] hover:border-[#9C5B6F]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-[#39313A]">PAC Correios</span>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            selectedShippingOption === "pac" ? "border-[#9C5B6F]" : "border-gray-300"
                          }`}>
                            {selectedShippingOption === "pac" && <span className="w-1.5 h-1.5 rounded-full bg-[#9C5B6F]" />}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500">3 a 6 dias úteis</div>
                        <div className="text-xs font-extrabold text-emerald-700 mt-1">
                          {shippingQuote.pac === 0 ? "FRETE GRÁTIS" : formatCurrency(shippingQuote.pac)}
                        </div>
                      </div>

                      {/* SEDEX */}
                      <div
                        onClick={() => setSelectedShippingOption("sedex")}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedShippingOption === "sedex"
                            ? "bg-[#FAF0F4] border-[#9C5B6F] ring-2 ring-[#9C5B6F]"
                            : "bg-white border-[#E9D9CD] hover:border-[#9C5B6F]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-[#39313A]">SEDEX Expresso</span>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            selectedShippingOption === "sedex" ? "border-[#9C5B6F]" : "border-gray-300"
                          }`}>
                            {selectedShippingOption === "sedex" && <span className="w-1.5 h-1.5 rounded-full bg-[#9C5B6F]" />}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500">1 a 2 dias úteis</div>
                        <div className="text-xs font-extrabold text-[#7A3F51] mt-1">
                          {formatCurrency(shippingQuote.sedex)}
                        </div>
                      </div>

                      {/* Express */}
                      <div
                        onClick={() => setSelectedShippingOption("express")}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedShippingOption === "express"
                            ? "bg-[#FAF0F4] border-[#9C5B6F] ring-2 ring-[#9C5B6F]"
                            : "bg-white border-[#E9D9CD] hover:border-[#9C5B6F]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-[#39313A]">Motoboy Express</span>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                            selectedShippingOption === "express" ? "border-[#9C5B6F]" : "border-gray-300"
                          }`}>
                            {selectedShippingOption === "express" && <span className="w-1.5 h-1.5 rounded-full bg-[#9C5B6F]" />}
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-500">Receba Hoje / 24h</div>
                        <div className="text-xs font-extrabold text-[#7A3F51] mt-1">
                          {formatCurrency(shippingQuote.express)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Linked Networks with Embedded Stock & Shipping */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Ou compre diretamente nas nossas Redes Vinculadas (Estoque Sincronizado):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {product.socialLinks?.instagramUrl && (
                    <a
                      href={product.socialLinks.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-2xl bg-[#FAF0F4] border border-[#E9D9CD] hover:border-[#9C5B6F] text-center transition-all"
                    >
                      <div className="text-xs font-bold text-[#7A3F51] flex items-center justify-center gap-1">
                        <Instagram className="w-3.5 h-3.5 text-[#9C5B6F]" />
                        <span>Instagram</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        {availableStock} em estoque
                      </div>
                    </a>
                  )}
                  {product.socialLinks?.shopeeUrl && (
                    <a
                      href={product.socialLinks.shopeeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-2xl bg-orange-50 border border-orange-200 hover:border-orange-400 text-center transition-all"
                    >
                      <div className="text-xs font-bold text-orange-800 flex items-center justify-center gap-1">
                        <span>Shopee</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <div className="text-[10px] text-orange-700 font-bold mt-0.5">
                        {availableStock} un • Frete Cupom
                      </div>
                    </a>
                  )}
                  {product.socialLinks?.mercadoLivreUrl && (
                    <a
                      href={product.socialLinks.mercadoLivreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-2xl bg-yellow-50 border border-yellow-300 hover:border-yellow-500 text-center transition-all"
                    >
                      <div className="text-xs font-bold text-yellow-900 flex items-center justify-center gap-1">
                        <span>Mercado Livre</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <div className="text-[10px] text-yellow-800 font-bold mt-0.5">
                        {availableStock} un • Envio Full
                      </div>
                    </a>
                  )}
                  {product.socialLinks?.tiktokUrl && (
                    <a
                      href={product.socialLinks.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-2xl bg-pink-50 border border-pink-200 hover:border-pink-400 text-center transition-all"
                    >
                      <div className="text-xs font-bold text-pink-900 flex items-center justify-center gap-1">
                        <span>TikTok Shop</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <div className="text-[10px] text-pink-700 font-bold mt-0.5">
                        {availableStock} un • Frete {isFreeShip ? "Grátis" : formatCurrency(product.shippingValue)}
                      </div>
                    </a>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* CHECKOUT MODAL DIRETO DA VITRINE */}
      <CheckoutModal
        isOpen={isDirectCheckoutOpen}
        onClose={() => setIsDirectCheckoutOpen(false)}
        items={[{ product, selectedVariation: selectedVar, quantity: 1 }]}
        subtotal={price}
        shippingAmount={activeShippingValue}
        discountAmount={0}
        total={totalWithShip}
      />
    </div>
  );
}
