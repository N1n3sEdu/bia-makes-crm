"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Sparkles, 
  RefreshCw, 
  Instagram, 
  MessageCircle, 
  Lock, 
  WifiOff, 
  Clock, 
  ShieldCheck
} from "lucide-react";
import { STORE_CONFIG } from "@/lib/data";

interface MaintenanceLoadingScreenProps {
  variant?: "maintenance" | "updating" | "offline" | "loading";
  title?: string;
  customMessage?: string;
  onRetry?: () => void;
  isAdmin?: boolean;
  onDeactivateMaintenance?: () => void;
}

const ROTATING_MESSAGES = [
  "✨ Otimizando vitrine e novidades exclusivas...",
  "💄 Sincronizando catálogo e estoque de cosméticos...",
  "🌸 Aplicando melhorias de velocidade e segurança...",
  "💎 Quase pronto! Restabelecendo conexão com a loja...",
];

export function MaintenanceLoadingScreen({
  variant = "maintenance",
  title,
  customMessage,
  onRetry,
  isAdmin = false,
  onDeactivateMaintenance,
}: MaintenanceLoadingScreenProps) {
  const [progress, setProgress] = useState(35);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [checkSuccess, setCheckSuccess] = useState(false);

  // Efeito de progresso simulado suave
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96; // mantém em 96% até reconectar
        const step = Math.floor(Math.random() * 8) + 3;
        return Math.min(prev + step, 96);
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Alterna mensagens informativas a cada 3.5 segundos
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setActiveMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 3500);

    return () => clearInterval(messageInterval);
  }, []);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setCheckSuccess(false);

    if (onRetry) {
      onRetry();
    }

    try {
      const res = await fetch("/api/store-state?t=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Se a manutenção tiver sido desativada ou a API responder com sucesso
        if (data && data.maintenanceMode === false) {
          setProgress(100);
          setCheckSuccess(true);
          setTimeout(() => {
            window.location.reload();
          }, 800);
          return;
        }
      }
    } catch {
      // Ignora erro de rede temporário
    }

    // Se ainda estiver em manutenção, dá o feedback
    setTimeout(() => {
      setIsChecking(false);
    }, 1200);
  };

  const getVariantContent = () => {
    switch (variant) {
      case "offline":
        return {
          badge: "Conexão Interrompida",
          badgeIcon: <WifiOff className="w-3.5 h-3.5 text-amber-600" />,
          mainTitle: title || "Sem Conexão com a Internet",
          description: customMessage || "Parece que sua conexão caiu. Assim que o sinal for restabelecido, o site da Bia Makes voltará automaticamente.",
        };
      case "updating":
        return {
          badge: "Atualização Técnica em Andamento",
          badgeIcon: <RefreshCw className="w-3.5 h-3.5 text-[#9C5B6F] animate-spin" />,
          mainTitle: title || "Voltamos Já!",
          description: customMessage || "Estamos publicando novidades incríveis na vitrine da Bia Makes. Estaremos de volta em instantes!",
        };
      case "loading":
        return {
          badge: "Carregando a Loja Oficial",
          badgeIcon: <Sparkles className="w-3.5 h-3.5 text-[#C69A76] animate-pulse" />,
          mainTitle: title || "Preparando sua Vitrine...",
          description: customMessage || "Aguarde só um momento enquanto preparamos os melhores cosméticos e ofertas exclusivas para você.",
        };
      case "maintenance":
      default:
        return {
          badge: "Manutenção & Atualização Programada",
          badgeIcon: <Sparkles className="w-3.5 h-3.5 text-[#C69A76] animate-pulse" />,
          mainTitle: title || "Voltamos Já!",
          description: customMessage || "O site da Bia Makes está passando por uma rápida atualização técnica para deixar sua experiência de compras e beleza ainda melhor. Voltaremos em instantes!",
        };
    }
  };

  const content = getVariantContent();

  const whatsappMessage = encodeURIComponent(
    "Olá Bia Makes! Vi que o site está em manutenção/atualização e gostaria de tirar uma dúvida ou fazer um pedido diretamente por aqui."
  );
  const whatsappUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF0F4] via-[#FAF7F8] to-[#EDE5F3] flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 relative overflow-hidden select-none">
      
      {/* Elementos visuais decorativos de fundo com tons de blush e rosé gold */}
      <div 
        aria-hidden="true" 
        className="absolute -top-32 -left-32 w-96 h-96 bg-[#F5DDE5]/60 rounded-full blur-3xl pointer-events-none animate-pulse-glow" 
      />
      <div 
        aria-hidden="true" 
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#E5CBB7]/40 rounded-full blur-3xl pointer-events-none animate-pulse-glow" 
      />
      <div 
        aria-hidden="true" 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#EDE5F3]/30 rounded-full blur-3xl pointer-events-none" 
      />

      {/* Top Header Discreto */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C5B6F]">
            Status: Atualização em Tempo Real
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#7A3F51]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Ambiente Seguro & Oficial Bia Makes</span>
        </div>
      </header>

      {/* Card Centralizado Principal */}
      <main className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl border border-[#E9D9CD] shadow-2xl p-6 sm:p-10 my-auto text-center space-y-7 z-10 relative">
        
        {/* LOGO CENTRALIZADA COM AURA GLOW E ANEL ROSÉ GOLD */}
        <div className="relative inline-block mx-auto">
          {/* Anel de brilho pulsante no tema */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#9C5B6F] via-[#C69A76] to-[#D4AF37] blur-md opacity-50 animate-pulse-glow" />
          
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mx-auto ring-4 ring-[#C69A76]/50 shadow-2xl bg-white">
            <Image
              src="/logo.jpg"
              alt="Logo Oficial Bia Makes"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Badge flutuante na logo */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white border border-[#E9D9CD] shadow-md flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="w-3 h-3 text-[#9C5B6F] animate-spin" style={{ animationDuration: "6s" }} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A3F51]">
              Breve Retorno
            </span>
          </div>
        </div>

        {/* Títulos e Identificação da Marca */}
        <div className="space-y-2.5 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF0F4] border border-[#E9D9CD] text-[11px] font-bold text-[#9C5B6F] uppercase tracking-wider shadow-sm">
            {content.badgeIcon}
            <span>{content.badge}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-black text-[#39313A] tracking-tight">
            {content.mainTitle}
          </h1>

          <p className="text-xs sm:text-sm text-[#39313A]/75 leading-relaxed max-w-md mx-auto">
            {content.description}
          </p>
        </div>

        {/* BARRA DE CARREGAMENTO NO TEMA BIA MAKES */}
        <div className="space-y-3 pt-2">
          {/* Container arredondado com efeito delicado */}
          <div className="relative w-full h-4 sm:h-5 bg-[#FAF0F4] rounded-full p-0.5 border border-[#E9D9CD] shadow-inner overflow-hidden">
            {/* Barra em gradiente vibrante de alta beleza com animação contínua */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#9C5B6F] via-[#C69A76] via-[#D4AF37] to-[#7A3F51] transition-all duration-700 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Efeito Shimmer metálico cruzando a barra */}
              <div 
                aria-hidden="true" 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full -translate-x-full animate-[loadingSlide_2s_infinite]" 
              />
            </div>
          </div>

          {/* Legenda de progresso e mensagem alternada */}
          <div className="flex items-center justify-between text-xs text-[#7A3F51] font-medium px-1">
            <span className="flex items-center gap-1.5 font-bold animate-pulse truncate text-[11px] sm:text-xs text-left max-w-[280px] sm:max-w-none">
              {ROTATING_MESSAGES[activeMessageIndex]}
            </span>
            <span className="font-extrabold text-[11px] sm:text-xs text-[#9C5B6F] shrink-0 ml-2">
              {progress}%
            </span>
          </div>
        </div>

        {/* BOTÃO INTERATIVO: VERIFICAR SE O SITE JÁ VOLTOU */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#9C5B6F]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 group"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            <span>
              {isChecking ? "Verificando conexão..." : checkSuccess ? "Site restabelecido! Recarregando..." : "Verificar se o site já voltou"}
            </span>
          </button>
        </div>

        {/* CANAIS DE ATENDIMENTO DIRETO (WHATSAPP E INSTAGRAM) */}
        <div className="pt-4 border-t border-[#E9D9CD]/70 space-y-3">
          <p className="text-[11px] font-bold text-[#7A3F51] uppercase tracking-wider">
            Precisa de ajuda ou quer fazer seu pedido agora mesmo?
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar no WhatsApp</span>
            </a>

            <a
              href={STORE_CONFIG.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-[#FAF0F4] text-[#9C5B6F] border border-[#E9D9CD] font-bold text-xs transition-colors shadow-sm"
            >
              <Instagram className="w-4 h-4 text-[#9C5B6F]" />
              <span>{STORE_CONFIG.instagramHandle}</span>
            </a>
          </div>
        </div>

        {/* CONTROLES ESPECIAIS PARA O ADMINISTRADOR */}
        {isAdmin && (
          <div className="pt-4 border-t border-amber-200 bg-amber-50/70 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-4 rounded-b-3xl space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Modo Administrador Identificado</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Você está autenticado no CRM. Clientes comuns estão visualizando esta tela de &quot;Voltamos já!&quot;.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Link
                href="/admin"
                className="px-4 py-2 rounded-full bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 shadow-sm transition-all"
              >
                Ir para o Painel Admin
              </Link>
              {onDeactivateMaintenance && (
                <button
                  type="button"
                  onClick={onDeactivateMaintenance}
                  className="px-4 py-2 rounded-full bg-[#9C5B6F] hover:bg-[#7A3F51] text-white font-bold text-xs shadow-sm transition-all"
                >
                  🚀 Desativar Manutenção e Abrir Loja
                </button>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Rodapé institucional com link para login administrativo */}
      <footer className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#39313A]/60 z-10 py-4">
        <div>
          © {new Date().getFullYear()} Bia Makes Cosméticos — Todos os direitos reservados.
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A3F51] hover:text-[#9C5B6F] hover:underline transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>Acesso da Equipe (CRM)</span>
          </Link>
        </div>
      </footer>

    </div>
  );
}
