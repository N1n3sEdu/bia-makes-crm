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
  const [copied, setCopied] = useState(false);

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
  const price = product.promoPrice || product.salePrice;
  const isFreeShip = product.freeShipping || product.shippingValue === 0;

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
    const shadeText = selectedVar ? ` (Tom: ${selectedVar.name})` : "";
    const shipValue = shippingQuote
      ? shippingQuote.pac
      : isFreeShip
      ? 0
      : product.shippingValue;
    const totalWithShip = price + shipValue;

    const msg =
      `Olá Bia Makes! 💕 Vi o link exclusivo das redes sociais e quero comprar:\n\n` +
      `💄 *${product.name}*${shadeText}\n` +
      `📦 *SKU:* ${product.sku} (Estoque confirmado: ${availableStock} un)\n` +
      `💰 *Valor do Produto:* ${formatCurrency(price)}\n` +
      `🚚 *Frete Embutido:* ${shipValue === 0 ? "FRETE GRÁTIS" : formatCurrency(shipValue)}\n` +
      `✨ *Total c/ Frete:* ${formatCurrency(totalWithShip)}\n\n` +
      `Podem me enviar a chave PIX para envio imediato?`;

    window.open(
      `https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(msg)}`,
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
                    <span className="font-bold text-[#9C5B6F]">
                      {selectedVar?.name} ({selectedVar?.stock} un. neste tom)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variations.map((v) => {
                      const active = selectedVar?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVar(v)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${
                            active
                              ? "bg-[#9C5B6F] text-white border-[#9C5B6F] shadow-sm"
                              : "bg-white text-[#39313A] border-[#E9D9CD] hover:border-[#9C5B6F]"
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/60"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <span>{v.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price + Total with Embedded Freight */}
              <div className="p-4 rounded-2xl bg-white border-2 border-[#C69A76]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  {product.promoPrice && (
                    <span className="text-xs text-gray-400 line-through block">
                      De {formatCurrency(product.salePrice)}
                    </span>
                  )}
                  <div className="text-3xl font-extrabold text-[#7A3F51]">
                    {formatCurrency(price)}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Total c/ Frete Base:{" "}
                    <strong className="text-[#39313A]">
                      {formatCurrency(price + (isFreeShip ? 0 : product.shippingValue))}
                    </strong>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleDirectWhatsApp}
                    className="px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Comprar no WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      addToCart(product, selectedVar);
                      router.push("/");
                    }}
                    className="px-5 py-3 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Adicionar à Sacola</span>
                  </button>
                </div>
              </div>

              {/* CEP Calculator */}
              <form onSubmit={handleCalculateShipping} className="p-4 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] space-y-2.5">
                <label className="text-xs font-bold text-[#39313A] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#9C5B6F]" />
                  <span>Simular Frete Exato para seu CEP:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    maxLength={9}
                    className="flex-1 px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#7A3F51] text-white text-xs font-bold hover:bg-[#9C5B6F]"
                  >
                    Calcular Frete
                  </button>
                </div>
                {shippingQuote && (
                  <div className="pt-2 border-t border-[#E9D9CD] text-xs space-y-1">
                    <div className="font-bold text-[#7A3F51]">{shippingQuote.region}</div>
                    <div className="flex justify-between">
                      <span>• Envio Econômico (PAC):</span>
                      <strong className="text-emerald-700">
                        {shippingQuote.pac === 0 ? "FRETE GRÁTIS" : formatCurrency(shippingQuote.pac)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• SEDEX Expresso:</span>
                      <strong>{formatCurrency(shippingQuote.sedex)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Entrega Motoboy / Flash:</span>
                      <strong>{formatCurrency(shippingQuote.express)}</strong>
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
    </div>
  );
}
