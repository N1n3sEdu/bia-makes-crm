"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  X, 
  Check, 
  Copy, 
  CreditCard, 
  QrCode, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  MessageCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Lock
} from "lucide-react";
import { CartItem, useBiaMakes } from "@/context/BiaMakesContext";
import { STORE_CONFIG } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Order } from "@/types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  onOrderCreated?: (order: Order) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  items,
  subtotal,
  shippingAmount,
  discountAmount,
  total,
  onOrderCreated,
}: CheckoutModalProps) {
  const { createStorefrontOrder } = useBiaMakes();

  // Etapas: 1 (Identificação & Endereço), 2 (Pagamento), 3 (Confirmação)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Formulário de Identificação & Endereço
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("SP");

  // Método de pagamento
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARTAO">("PIX");
  const [installments, setInstallments] = useState<number>(1);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Feedback do PIX
  const [pixCopied, setPixCopied] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Máscara de Telefone
  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/\D/g, "");
    if (clean.length > 11) clean = clean.slice(0, 11);
    if (clean.length <= 10) {
      clean = clean.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
      clean = clean.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }
    setCustomerPhone(clean);
  };

  // Máscara de CEP e preenchimento inteligente
  const handleCepChange = (val: string) => {
    let clean = val.replace(/\D/g, "");
    if (clean.length > 8) clean = clean.slice(0, 8);
    const formatted = clean.replace(/^(\d{5})(\d{0,3})/, "$1-$2");
    setCep(formatted);

    if (clean.length === 8) {
      // Simulação rápida de preenchimento inteligente
      if (clean.startsWith("01") || clean.startsWith("02") || clean.startsWith("03")) {
        setStreet("Av. Paulista");
        setNeighborhood("Bela Vista");
        setCity("São Paulo");
        setStateUf("SP");
      } else if (clean.startsWith("20") || clean.startsWith("22")) {
        setStreet("Av. Atlântica");
        setNeighborhood("Copacabana");
        setCity("Rio de Janeiro");
        setStateUf("RJ");
      } else if (clean.startsWith("30")) {
        setStreet("Rua da Bahia");
        setNeighborhood("Centro");
        setCity("Belo Horizonte");
        setStateUf("MG");
      } else {
        setCity("São Paulo");
        setStateUf("SP");
      }
    }
  };

  // Máscara de Cartão de Crédito
  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    const parts = clean.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(" ") : clean);
  };

  const handleExpiryChange = (val: string) => {
    let clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 2) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setCardExpiry(clean);
  };

  // Validação da Etapa 1
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Por favor, informe seu nome completo.");
      return;
    }
    if (customerPhone.replace(/\D/g, "").length < 10) {
      alert("Por favor, informe um WhatsApp válido com DDD.");
      return;
    }
    if (!street.trim() || !number.trim() || !city.trim()) {
      alert("Por favor, preencha o endereço completo para entrega.");
      return;
    }
    setStep(2);
  };

  // Código PIX Copia e Cola gerado para o pedido
  const pixMockCode = `00020126580014br.gov.bcb.pix0136${STORE_CONFIG.supportEmail}5204000053039865405${total.toFixed(2)}5802BR5916BIA MAKES BEAUTY6009SAO PAULO62140510BM${Math.floor(1000 + Math.random() * 9000)}6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixMockCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  // Confirmação final do Pedido
  const handleConfirmOrder = () => {
    if (items.length === 0) {
      alert("Sua sacola está vazia.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullAddress = `${street}, ${number}${complement ? ` - ${complement}` : ""}, ${neighborhood} - ${city}/${stateUf} (CEP: ${cep})`;
      
      const order = createStorefrontOrder({
        customerName,
        customerPhone,
        customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, ".")}@cliente.com`,
        shippingAddress: fullAddress,
        paymentMethod: paymentMethod === "PIX" ? "PIX" : "CARTAO",
        channel: "SITE",
        shippingAmount,
        discountAmount,
        items,
      });

      setCreatedOrder(order);
      if (onOrderCreated) {
        onOrderCreated(order);
      }
      setStep(3);
    } catch (err: any) {
      alert(err?.message || "Erro ao processar pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar comprovante no WhatsApp
  const handleSendWhatsAppConfirmation = () => {
    if (!createdOrder) return;

    let itemsList = "";
    createdOrder.items.forEach((it, idx) => {
      itemsList += `${idx + 1}. *${it.productName}*${it.variationName ? ` (${it.variationName})` : ""} - ${it.quantity}x ${formatCurrency(it.price)}\n`;
    });

    const msg =
      `Olá Bia Makes! 💕 Acabei de realizar meu pedido pelo site e estou enviando a confirmação:\n\n` +
      `💄 *PEDIDO #${createdOrder.orderNumber}*\n` +
      `👤 *Cliente:* ${createdOrder.customerName}\n` +
      `📱 *WhatsApp:* ${createdOrder.customerPhone}\n` +
      `📍 *Endereço de Entrega:* ${createdOrder.shippingAddress}\n\n` +
      `🛍️ *Itens Reservados:*\n${itemsList}\n` +
      `💳 *Forma de Pagamento:* ${createdOrder.paymentMethod}\n` +
      `🚚 *Frete:* ${shippingAmount === 0 ? "GRÁTIS" : formatCurrency(shippingAmount)}\n` +
      `✨ *TOTAL PAGO:* ${formatCurrency(createdOrder.totalAmount)}\n\n` +
      `Podem confirmar a expedição dos meus cosméticos? Muito obrigada! 💕`;

    window.open(
      `https://api.whatsapp.com/send?phone=${STORE_CONFIG.whatsappNumber}&text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-[#E9D9CD] shadow-2xl overflow-hidden my-6 relative flex flex-col max-h-[92vh]">
        
        {/* Header do Checkout */}
        <div className="p-5 border-b border-[#E9D9CD] bg-gradient-to-r from-[#FAF0F4] via-white to-[#FAF0F4] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#7A3F51] to-[#9C5B6F] text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#39313A]">
                Checkout Seguro • Bia Makes
              </h3>
              <p className="text-[11px] text-[#39313A]/70 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Ambiente Criptografado & Estoque Reservado em Tempo Real</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso das Etapas */}
        <div className="px-6 py-2.5 bg-[#FAF7F8] border-b border-[#E9D9CD]/70 flex items-center justify-between text-xs font-bold shrink-0">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-[#7A3F51]" : "text-gray-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 1 ? "bg-[#7A3F51] text-white" : "bg-gray-200 text-gray-500"
            }`}>1</span>
            <span>Identificação</span>
          </div>
          <div className={`h-0.5 w-12 ${step >= 2 ? "bg-[#7A3F51]" : "bg-gray-200"}`} />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-[#7A3F51]" : "text-gray-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step >= 2 ? "bg-[#7A3F51] text-white" : "bg-gray-200 text-gray-500"
            }`}>2</span>
            <span>Pagamento</span>
          </div>
          <div className={`h-0.5 w-12 ${step === 3 ? "bg-emerald-600" : "bg-gray-200"}`} />
          <div className={`flex items-center gap-1.5 ${step === 3 ? "text-emerald-700" : "text-gray-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step === 3 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>3</span>
            <span>Confirmação</span>
          </div>
        </div>

        {/* Conteúdo Dinâmico com Rolagem */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* ================================================================= */}
          {/* ETAPA 1: IDENTIFICAÇÃO E ENTREGA */}
          {/* ================================================================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              
              {/* Resumo Rápido dos Itens */}
              <div className="p-3 rounded-2xl bg-[#FAF0F4] border border-[#E9D9CD] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#7A3F51]">
                    {items.reduce((sum, it) => sum + it.quantity, 0)} {items.reduce((sum, it) => sum + it.quantity, 0) === 1 ? "item na sacola" : "itens na sacola"}
                  </span>
                  <div className="text-[10px] text-gray-500">
                    Frete: {shippingAmount === 0 ? "GRÁTIS" : formatCurrency(shippingAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Total Previsto</span>
                  <span className="text-base font-extrabold text-[#7A3F51]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C69A76] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#9C5B6F]" />
                  <span>1. Seus Dados de Contato</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Camila Guimarães"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#25D366]" />
                      <span>WhatsApp (DDD + Número) *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 98765-4321"
                      value={customerPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A] flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span>E-mail para Rastreio</span>
                    </label>
                    <input
                      type="email"
                      placeholder="camila@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="space-y-3 pt-2 border-t border-[#E9D9CD]/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#C69A76] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#9C5B6F]" />
                  <span>2. Endereço de Envio</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">CEP *</label>
                    <input
                      type="text"
                      required
                      placeholder="00000-000"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">Rua / Logradouro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Rua Oscar Freire"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">Número *</label>
                    <input
                      type="text"
                      required
                      placeholder="1200"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">Complemento</label>
                    <input
                      type="text"
                      placeholder="Apto 42 / Bloco B"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">Bairro *</label>
                    <input
                      type="text"
                      required
                      placeholder="Jardins"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">Cidade *</label>
                    <input
                      type="text"
                      required
                      placeholder="São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">Estado (UF) *</label>
                    <input
                      type="text"
                      required
                      placeholder="SP"
                      maxLength={2}
                      value={stateUf}
                      onChange={(e) => setStateUf(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] uppercase font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Avanço */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] hover:opacity-95 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <span>Avançar para Opções de Pagamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ================================================================= */}
          {/* ETAPA 2: OPÇÕES DE PAGAMENTO (PIX OU CARTÃO) */}
          {/* ================================================================= */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Seletor de Abas de Pagamento */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD]">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("PIX")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === "PIX"
                      ? "bg-[#7A3F51] text-white shadow-sm"
                      : "text-gray-600 hover:text-[#7A3F51]"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>PIX Instantâneo</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase">
                    Aprovação Imediata
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARTAO")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === "CARTAO"
                      ? "bg-[#7A3F51] text-white shadow-sm"
                      : "text-gray-600 hover:text-[#7A3F51]"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão de Crédito</span>
                  <span className="text-[9px] opacity-80">
                    Até 3x s/ juros
                  </span>
                </button>
              </div>

              {/* ABA PIX */}
              {paymentMethod === "PIX" && (
                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FAF0F4] via-white to-[#FAF0F4] border border-[#E9D9CD] space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider bg-emerald-100 px-3 py-0.5 rounded-full inline-block">
                      Chave PIX Oficial Registrada
                    </span>
                    <div className="text-xl font-extrabold text-[#7A3F51]">
                      {formatCurrency(total)}
                    </div>
                    <p className="text-[11px] text-[#39313A]/70">
                      Escaneie o QR Code abaixo ou utilize o código Copia e Cola no aplicativo do seu banco:
                    </p>
                  </div>

                  {/* QR Code Ilustrativo Estilizado */}
                  <div className="flex justify-center py-2">
                    <div className="p-3 bg-white rounded-2xl border-2 border-[#C69A76]/50 shadow-md relative group">
                      <div className="w-40 h-40 bg-[#FAF7F8] rounded-xl flex flex-col items-center justify-center p-2 border border-dashed border-[#9C5B6F]/40 relative overflow-hidden">
                        {/* Grade simulada de QR code */}
                        <div className="absolute inset-2 grid grid-cols-6 grid-rows-6 gap-1 opacity-75">
                          <div className="bg-[#7A3F51] rounded-sm col-span-2 row-span-2" />
                          <div className="bg-[#9C5B6F] rounded-sm" />
                          <div className="bg-[#7A3F51] rounded-sm" />
                          <div className="bg-[#7A3F51] rounded-sm col-span-2 row-span-2" />
                          <div className="bg-[#9C5B6F] rounded-sm" />
                          <div className="bg-[#7A3F51] rounded-sm" />
                          <div className="bg-[#9C5B6F] rounded-sm" />
                          <div className="bg-[#7A3F51] rounded-sm" />
                          <div className="bg-[#7A3F51] rounded-sm col-span-2 row-span-2" />
                          <div className="bg-[#9C5B6F] rounded-sm" />
                          <div className="bg-[#7A3F51] rounded-sm" />
                          <div className="bg-[#9C5B6F] rounded-sm" />
                          <div className="bg-[#7A3F51] rounded-sm" />
                          <div className="bg-[#7A3F51] rounded-sm" />
                          <div className="bg-[#9C5B6F] rounded-sm" />
                        </div>
                        {/* Logo Central */}
                        <div className="relative z-10 w-10 h-10 rounded-full bg-white p-1 shadow-lg border border-[#C69A76]">
                          <Image src="/logo.jpg" alt="Bia Makes" width={40} height={40} className="rounded-full object-cover" />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-center text-gray-500 mt-2">
                        Bia Makes Beauty Ltda • Banco Central
                      </div>
                    </div>
                  </div>

                  {/* Campo Copia e Cola */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#39313A] flex items-center justify-between">
                      <span>Código PIX Copia e Cola:</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Chave: {STORE_CONFIG.supportEmail}</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={pixMockCode}
                        className="flex-1 px-3 py-2 text-[10px] font-mono bg-white rounded-xl border border-[#E9D9CD] text-gray-600 truncate focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                          pixCopied
                            ? "bg-emerald-600 text-white"
                            : "bg-[#9C5B6F] hover:bg-[#7A3F51] text-white"
                        }`}
                      >
                        {pixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{pixCopied ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Confirmação Instantânea:</span>
                    </div>
                    <p className="text-[10px] text-emerald-800 leading-relaxed">
                      Ao clicar no botão abaixo, o pedido será gravado no CRM, os itens serão reservados e você receberá o comprovante para envio no WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {/* ABA CARTÃO DE CRÉDITO */}
              {paymentMethod === "CARTAO" && (
                <div className="p-4 rounded-3xl bg-[#FAF7F8] border border-[#E9D9CD] space-y-4">
                  {/* Cartão de Crédito Visual Estilizado */}
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#7A3F51] via-[#9C5B6F] to-[#C69A76] text-white shadow-lg space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold uppercase tracking-widest text-white/90">Bia Makes Beauty Card</span>
                      <CreditCard className="w-5 h-5 text-amber-200" />
                    </div>
                    <div className="text-lg font-mono tracking-widest py-1">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase opacity-75 block">Titular</span>
                        <span className="font-bold uppercase tracking-wider">{cardHolder || "NOME DO CLIENTE"}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase opacity-75 block">Validade</span>
                        <span className="font-bold">{cardExpiry || "MM/AA"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Parcelamento */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#39313A]">Condições de Parcelamento:</label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-bold text-[#7A3F51]"
                    >
                      <option value={1}>1x de {formatCurrency(total)} (À vista sem juros)</option>
                      <option value={2}>2x de {formatCurrency(total / 2)} sem juros</option>
                      <option value={3}>3x de {formatCurrency(total / 3)} sem juros</option>
                    </select>
                  </div>

                  {/* Campos do Cartão */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-[#39313A]">Número do Cartão:</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-mono"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-[#39313A]">Nome Impresso no Cartão:</label>
                      <input
                        type="text"
                        placeholder="Como está no cartão"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#39313A]">Validade (MM/AA):</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#39313A]">CVV:</label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação da Etapa 2 */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-full bg-white border border-[#E9D9CD] text-[#7A3F51] font-bold text-xs hover:bg-[#FAF7F8] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmOrder}
                  className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:opacity-95 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmitting ? "Gravando Pedido..." : `Confirmar Pedido de ${formatCurrency(total)}`}
                  </span>
                </button>
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* ETAPA 3: CONFIRMAÇÃO DO PEDIDO & ACOMPANHAMENTO NO WHATSAPP */}
          {/* ================================================================= */}
          {step === 3 && createdOrder && (
            <div className="space-y-5 text-center py-2 animate-in zoom-in-95 duration-200">
              
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-50">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider inline-block">
                  Pedido Gravado com Sucesso no CRM
                </span>
                <h3 className="font-display text-2xl font-extrabold text-[#39313A] mt-2">
                  Obrigada pela compra, {createdOrder.customerName.split(" ")[0]}! 💕
                </h3>
                <p className="text-xs text-[#39313A]/70 mt-1 max-w-sm mx-auto">
                  Seu estoque foi reservado com segurança e o seu pedido já está registrado no nosso sistema administrativo.
                </p>
              </div>

              {/* Card de Detalhes do Pedido */}
              <div className="p-4 rounded-3xl bg-[#FAF0F4] border border-[#E9D9CD] text-left space-y-3">
                <div className="flex items-center justify-between border-b border-[#E9D9CD]/70 pb-2">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block font-semibold">Código do Pedido</span>
                    <span className="font-mono text-base font-extrabold text-[#7A3F51]">
                      #{createdOrder.orderNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase block font-semibold">Total a Pagar</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {formatCurrency(createdOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 text-[#39313A]">
                  <div>
                    <strong>Forma de Pagamento:</strong> {createdOrder.paymentMethod}
                  </div>
                  <div>
                    <strong>Entrega para:</strong> {createdOrder.shippingAddress}
                  </div>
                  <div>
                    <strong>Itens Reservados:</strong> {createdOrder.items.length} produto(s)
                  </div>
                </div>
              </div>

              {/* Botão Principal de Envio no WhatsApp */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsAppConfirmation}
                  className="w-full py-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs transition-all shadow-lg shadow-[#25D366]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Enviar Comprovante e Acompanhar no WhatsApp Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-full bg-white border border-[#E9D9CD] text-[#7A3F51] font-bold text-xs hover:bg-[#FAF7F8] transition-all cursor-pointer"
                >
                  Continuar Comprando na Loja
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
