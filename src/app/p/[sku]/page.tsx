"use client";

import React, { useState, useEffect, useRef } from "react";
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
import {
  formatCurrency,
  formatDateShort,
  fetchCepInfo,
  formatCepMask,
  calculateCarrierQuotesByCep,
  type CepInfo,
} from "@/lib/utils";
import { ProductVariation, ShippingCarrierId, ShippingQuoteOption } from "@/types";
import { STORE_CONFIG } from "@/lib/data";
import { CheckoutModal } from "@/components/storefront/CheckoutModal";
import { ProductImage } from "@/components/storefront/ProductImage";
import { MaintenanceLoadingScreen } from "@/components/MaintenanceLoadingScreen";
import { trackEvent } from "@/lib/analytics/track";

export default function ProductSocialEmbedPage() {
  const params = useParams();
  const router = useRouter();
  const skuParam = decodeURIComponent((params?.sku as string) || "");

  const {
    products,
    addToCart,
    createStorefrontOrder,
    isMaintenanceMode,
    maintenanceMessage,
    setMaintenanceMode,
    isSystemOffline,
    isAdminAuthenticated,
  } = useBiaMakes();

  const product = products.find(
    (p) => p.sku.toLowerCase() === skuParam.toLowerCase() || p.id === skuParam
  );

  const [selectedVar, setSelectedVar] = useState<ProductVariation | undefined>(
    product?.variations?.[0]
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cep, setCep] = useState("");
  const [cepError, setCepError] = useState("");
  const [cepInfo, setCepInfo] = useState<CepInfo | null>(null);
  const [isCalculatingCep, setIsCalculatingCep] = useState(false);
  const [shippingQuote, setShippingQuote] = useState<{
    region: string;
    quotes: ShippingQuoteOption[];
  } | null>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<ShippingCarrierId>("JADLOG_PACKAGE");
  const [copied, setCopied] = useState(false);
  const [isDirectCheckoutOpen, setIsDirectCheckoutOpen] = useState(false);
  const loadedProductIdRef = useRef<string | null>(null);

  // Sincroniza a variação padrão e reseta imagem quando o produto carrega do contexto hidratado
  useEffect(() => {
    if (product && loadedProductIdRef.current !== product.id) {
      loadedProductIdRef.current = product.id;
      setSelectedVar(product.variations?.[0]);
      setSelectedImageIndex(0);
    }
  }, [product]);

  useEffect(() => {
    if (product?.sku) {
      trackEvent("product_view", { product_sku: product.sku });
    }
  }, [product?.sku]);

  // Se a conexão caiu (offline)
  if (isSystemOffline) {
    return (
      <MaintenanceLoadingScreen
        variant="offline"
        isAdmin={isAdminAuthenticated}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Se o site estiver em manutenção e não for admin autenticado
  if (isMaintenanceMode && !isAdminAuthenticated) {
    return (
      <MaintenanceLoadingScreen
        variant="maintenance"
        customMessage={maintenanceMessage}
        isAdmin={isAdminAuthenticated}
        onDeactivateMaintenance={() => setMaintenanceMode(false)}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F8] p-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E9D9CD] shadow-lg text-center space-y-4 max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-[#FAF0F4] text-[#9C5B6F] flex items-center justify-center mx-auto border border-[#E9D9CD]">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#39313A]">
            Produto não encontrado
          </h1>
          <p className="text-xs text-[#39313A]/70 leading-relaxed">
            O código <strong className="font-mono text-[#7A3F51]">{skuParam || "solicitado"}</strong> não foi localizado em nosso catálogo atual ou foi descontinuado.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] text-white text-xs font-bold shadow-md hover:opacity-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explorar Catálogo Completo</span>
            </Link>
          </div>
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
  const isFreeShip = product.freeShipping || price >= STORE_CONFIG.freeShippingThreshold || product.shippingValue === 0;

  const selectedQuote = shippingQuote
    ? shippingQuote.quotes.find((q) => q.carrierId === selectedCarrierId) || shippingQuote.quotes[0] || null
    : null;

  // Valor, custo real da loja e nome da modalidade de frete atualmente selecionada
  // Regra estrita: com CEP em branco, activeShippingValue = 0 (NUNCA somar frete fixo ao total)
  const activeShippingValue = selectedQuote
    ? selectedQuote.customerPrice
    : 0;

  const activeCompanyShippingCost = selectedQuote
    ? selectedQuote.companyCost
    : 0;

  const activeShippingName = selectedQuote
    ? `${selectedQuote.carrierName} (${selectedQuote.deliveryDays})`
    : isFreeShip
      ? "Frete Grátis"
      : "A calcular pelo CEP";

  const totalWithShip = price + activeShippingValue;

  const runShippingLookup = async (cleanCep: string) => {
    if (cleanCep.length < 8) {
      setCepError("Informe um CEP válido com 8 dígitos (Ex: 01310-100).");
      setShippingQuote(null);
      setCepInfo(null);
      return;
    }

    setCepError("");
    setIsCalculatingCep(true);
    try {
      const info = await fetchCepInfo(cleanCep);
      setCepInfo(info);
      const quotes = calculateCarrierQuotesByCep(info, 1, price, Boolean(product.freeShipping));
      const locationPrefix = info.bairro ? `${info.bairro} — ` : "";
      setShippingQuote({
        region: `📍 Entrega para ${locationPrefix}${info.localidade}/${info.uf} (${info.estimatedDaysLabel})`,
        quotes,
      });
      if (quotes[0]) {
        setSelectedCarrierId(quotes[0].carrierId);
      }
    } catch (err) {
      setCepError(err instanceof Error ? err.message : "CEP não encontrado.");
      setShippingQuote(null);
      setCepInfo(null);
    } finally {
      setIsCalculatingCep(false);
    }
  };

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cep.replace(/\D/g, "");
    await runShippingLookup(clean);
  };

  const handleCepInputChange = (raw: string) => {
    const masked = formatCepMask(raw);
    setCep(masked);
    if (cepError) setCepError("");
    const clean = masked.replace(/\D/g, "");
    if (clean.length < 8) {
      if (shippingQuote) setShippingQuote(null);
      if (cepInfo) setCepInfo(null);
      return;
    }
    if (clean.length === 8) {
      void runShippingLookup(clean);
    }
  };

  const handleDirectWhatsApp = () => {
    if (isVarOutOfStock) {
      alert("O tom selecionado está esgotado no momento.");
      return;
    }

    const order = createStorefrontOrder({
      customerName: "Cliente via Link WhatsApp",
      customerPhone: "Via WhatsApp Direct",
      shippingAddress: shippingQuote?.region || "A combinar via WhatsApp",
      paymentMethod: "WHATSAPP",
      channel: "WHATSAPP",
      shippingAmount: activeShippingValue,
      companyShippingCost: activeCompanyShippingCost,
      shippingCarrier: selectedQuote?.carrierName || "Correios PAC",
      shippingServiceDays: selectedQuote?.deliveryDays,
      shippingCep: cep || undefined,
      isFreeShippingSubsidized: activeShippingValue === 0,
      discountAmount: 0,
      items: [
        {
          product,
          selectedVariation: selectedVar,
          quantity: 1,
        },
      ],
    });

    trackEvent("outbound_click", { target: "whatsapp", product_sku: product.sku });
    trackEvent("whatsapp_order", {
      value_cents: Math.round(order.totalAmount * 100),
      order_number: order.orderNumber,
    });

    const shadeText = selectedVar ? ` (Tom: ${selectedVar.name})` : "";
    const shippingLabelForWhatsapp = selectedQuote
      ? `${activeShippingName} (${activeShippingValue === 0 ? "FRETE GRÁTIS" : formatCurrency(activeShippingValue)})`
      : isFreeShip
        ? "Frete Grátis"
        : "A calcular pelo CEP";
    const msg =
      `Olá Bia Makes! 💕 Realizei o pedido *#${order.orderNumber}* pelo link exclusivo das redes sociais:\n\n` +
      `💄 *${product.name}*${shadeText}\n` +
      `📦 *SKU:* ${product.sku}\n` +
      `💰 *Valor do Produto:* ${formatCurrency(price)}\n` +
      `🚚 *Modalidade de Frete Selecionada:* ${shippingLabelForWhatsapp}\n` +
      `✨ *Total${selectedQuote || isFreeShip ? " c/ Frete" : ""}:* ${formatCurrency(order.totalAmount)}\n\n` +
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
            <div className="md:col-span-5 space-y-3">
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-bia-offwhite border border-bia-nude">
                <ProductImage
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={`${product.name} - Foto ${selectedImageIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                  <span className="px-3 py-1 rounded-full bg-bia-marsala text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                    Vitrine Oficial Redes Sociais
                  </span>
                </div>
              </div>

              {/* Miniaturas da Galeria quando há múltiplas imagens */}
              {product.images && product.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {product.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? "border-bia-marsala-dark ring-2 ring-bia-marsala-dark/30 scale-[1.03]"
                          : "border-bia-nude opacity-75 hover:opacity-100"
                      }`}
                    >
                      <ProductImage
                        src={imgUrl}
                        alt={`${product.name} miniatura ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Authenticity & Batch Info */}
              <div className="p-3.5 rounded-2xl bg-bia-offwhite border border-bia-nude/80 text-[11px] space-y-1 text-bia-text/80">
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
                  <span className="text-xs font-bold uppercase tracking-wider text-bia-rosegold-dark">
                    {product.category} • {product.brand}
                  </span>
                  <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-bia-text/75">({product.reviewsCount} avaliações)</span>
                  </div>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-bia-text mt-1">
                  {product.name}
                </h1>

                <p className="text-xs sm:text-sm text-bia-text/80 mt-2 leading-relaxed">
                  {product.description}
                </p>

                {/* Selos e Tags Dermatológicas */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {product.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full bg-bia-pink-light border border-bia-nude text-bia-marsala-dark text-[11px] font-bold flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-bia-rosegold" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* EMBEDDED LIVE STOCK & EMBEDDED FREIGHT HIGHLIGHT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase text-emerald-800">
                      Estoque Embutido (Tempo Real)
                    </div>
                    <div className="text-base font-extrabold text-emerald-900">
                      {availableStock} unidades prontas
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-bia-pink-light border border-bia-nude flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bia-pink flex items-center justify-center text-bia-marsala shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase text-bia-marsala-dark">
                      Frete Selecionado
                    </div>
                    <div className="text-base font-extrabold text-bia-marsala-dark">
                      {selectedQuote ? (
                        selectedQuote.customerPrice === 0 ? (
                          <span className="text-emerald-700">FRETE GRÁTIS</span>
                        ) : (
                          formatCurrency(selectedQuote.customerPrice)
                        )
                      ) : isFreeShip ? (
                        <span className="text-emerald-700">FRETE GRÁTIS</span>
                      ) : (
                        <span className="text-sm font-bold text-bia-marsala">A calcular pelo CEP</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shade / Variation Selector */}
              {product.variations?.length > 0 && (
                <div className="p-4 rounded-2xl bg-bia-offwhite border border-bia-nude space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-bia-text">Escolha o Tom / Variação:</span>
                    <span className={`font-bold ${isVarOutOfStock ? "text-rose-600" : "text-bia-marsala"}`}>
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
                              ? "bg-bia-marsala text-white border-bia-marsala shadow-sm"
                              : "bg-white text-bia-text border-bia-nude hover:border-bia-marsala"
                          } ${isOutOfStock ? "opacity-50" : ""}`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full ring-1 ring-inset ring-black/15 shrink-0"
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
                      <span className="font-bold text-[#7A3F51]">{activeShippingName}</span>
                      {selectedQuote ? (
                        <>
                          {" "}
                          (
                          <span className={activeShippingValue === 0 ? "text-emerald-700 font-bold" : "font-bold text-[#39313A]"}>
                            {activeShippingValue === 0 ? "GRÁTIS" : formatCurrency(activeShippingValue)}
                          </span>
                          )
                        </>
                      ) : isFreeShip ? (
                        <>
                          {" "}
                          (
                          <span className="text-emerald-700 font-bold">
                            GRÁTIS
                          </span>
                          )
                        </>
                      ) : null}
                    </div>
                    <div>
                      Total{selectedQuote || isFreeShip ? " com Frete" : ""}:{" "}
                      <strong className="text-base text-[#39313A]">
                        {formatCurrency(totalWithShip)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      setIsDirectCheckoutOpen(true);
                    }}
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
                    inputMode="numeric"
                    placeholder="Digite seu CEP (ex: 01310-100)"
                    value={cep}
                    onChange={(e) => handleCepInputChange(e.target.value)}
                    maxLength={9}
                    className={`flex-1 px-3.5 py-2 text-xs bg-white rounded-xl border focus:outline-none font-semibold ${
                      cepError
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-[#E9D9CD] focus:border-[#9C5B6F]"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isCalculatingCep}
                    className="px-4 py-2 rounded-xl bg-[#7A3F51] text-white text-xs font-bold hover:bg-[#9C5B6F] disabled:opacity-60 cursor-pointer"
                  >
                    {isCalculatingCep ? "Buscando..." : "Calcular Frete"}
                  </button>
                </div>
                {cepError && (
                  <p role="alert" className="text-[11px] font-semibold text-rose-600">
                    {cepError}
                  </p>
                )}
                {shippingQuote && (
                  <div className="pt-2 border-t border-[#E9D9CD] space-y-2">
                    <div className="font-bold text-xs text-[#7A3F51]">{shippingQuote.region}</div>
                    
                    {/* Radio Cards Clicáveis de Transportadoras */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {shippingQuote.quotes.map((quote) => {
                        const isSelected = selectedQuote?.carrierId === quote.carrierId;
                        return (
                          <div
                            key={quote.carrierId}
                            onClick={() => setSelectedCarrierId(quote.carrierId)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-[#FAF0F4] border-[#9C5B6F] ring-2 ring-[#9C5B6F]"
                                : "bg-white border-[#E9D9CD] hover:border-[#9C5B6F]"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[#39313A]">
                                  {quote.carrierName}
                                </span>
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[#FAF7F8] border border-[#E9D9CD] text-[#7A3F51]">
                                  {quote.serviceLabel}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-600">{quote.deliveryDays}</div>
                            </div>

                            <div className="text-right shrink-0">
                              {quote.isFreeForCustomer ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-gray-400 line-through">
                                    {formatCurrency(quote.companyCost)}
                                  </span>
                                  <span className="text-[11px] font-extrabold text-emerald-700">
                                    FRETE GRÁTIS
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs font-extrabold text-[#7A3F51]">
                                  {formatCurrency(quote.customerPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                      onClick={() => trackEvent("outbound_click", { target: "instagram", product_sku: product.sku })}
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
                      onClick={() => trackEvent("outbound_click", { target: "shopee", product_sku: product.sku })}
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
                      onClick={() => trackEvent("outbound_click", { target: "mercado_livre", product_sku: product.sku })}
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
                      onClick={() => trackEvent("outbound_click", { target: "tiktok", product_sku: product.sku })}
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
        discountAmount={0}
        total={totalWithShip}
        initialCep={cep}
        initialCepInfo={cepInfo}
        initialCarrierId={selectedQuote?.carrierId || selectedCarrierId}
      />
    </div>
  );
}
