"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShoppingBag, 
  Instagram, 
  Sparkles,
  ShieldCheck,
  UserCheck,
  LogOut,
  ExternalLink,
  Lock
} from "lucide-react";
import { SystemUser } from "@/types";

interface NavigationProps {
  variant?: 'storefront' | 'admin';
  cartCount: number;
  onOpenCart?: () => void;
  isAdminAuthenticated?: boolean;
  adminUser?: SystemUser;
  onLogoutAdmin?: () => void;
}

export function Navigation({
  variant = 'storefront',
  cartCount,
  onOpenCart,
  isAdminAuthenticated = false,
  adminUser,
  onLogoutAdmin,
}: NavigationProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E9D9CD]/60 shadow-sm transition-all">
      {/* Top Notice Bar */}
      <div className="bg-gradient-to-r from-[#F5DDE5] via-[#FAF7F8] to-[#EDE5F3] px-4 py-1.5 text-xs text-[#39313A] border-b border-[#E9D9CD]/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C69A76] animate-pulse" />
            <span className="font-medium">
              {variant === 'admin'
                ? 'Ambiente Administrativo Criptografado — Sincronização Multicanal Ativa'
                : 'Frete Grátis nas compras acima de R$ 149,00 para todo o Brasil!'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="https://instagram.com/biamakeoficial_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-[#9C5B6F] hover:text-[#7A3F51] transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@biamakeoficial_</span>
            </a>
            <span className="hidden md:inline text-[#E9D9CD]">|</span>
            <span className="hidden md:flex items-center gap-1 text-[#39313A]/70 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cosméticos 100% Originais & Regulamentados
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#C69A76]/50 shadow-md group-hover:scale-105 transition-transform">
              <Image 
                src="/logo.jpg" 
                alt="Logo Bia Make Oficial"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-2xl tracking-tight font-extrabold text-[#7A3F51]">
                  Bia
                </span>
                <span className="font-display text-xl tracking-widest text-[#9C5B6F] font-semibold">
                  MAKE
                </span>
                {variant === 'admin' && (
                  <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#9C5B6F] text-white rounded-full">
                    CRM / ERP
                  </span>
                )}
              </div>
              <p className="text-[10px] tracking-wider uppercase text-[#C69A76] font-bold">
                {variant === 'admin' ? 'Central de Gestão Integrada' : 'Cosméticos & Alta Beleza'}
              </p>
            </div>
          </Link>

          {/* Center Navigation Links (Customer Storefront Only) */}
          {variant === 'storefront' && (
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#39313A]/80">
              <a href="#catalogo" className="hover:text-[#9C5B6F] transition-colors">
                Catálogo Oficial
              </a>
              <a href="#catalogo" className="hover:text-[#9C5B6F] transition-colors">
                Rosto & Bases HD
              </a>
              <a href="#catalogo" className="hover:text-[#9C5B6F] transition-colors">
                Lábios & Batons
              </a>
              <a href="#redes-canais" className="hover:text-[#9C5B6F] transition-colors flex items-center gap-1">
                <span>Canais & Redes</span>
              </a>
            </nav>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {variant === 'storefront' ? (
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-2 bg-[#F5DDE5]/80 hover:bg-[#F5DDE5] text-[#7A3F51] px-4 py-2.5 rounded-full border border-[#E9D9CD] transition-all shadow-sm group"
                aria-label="Abrir sacola de compras"
              >
                <ShoppingBag className="w-4 h-4 transition-transform group-hover:scale-110 text-[#9C5B6F]" />
                <span className="text-xs font-bold hidden sm:inline">Minha Sacola</span>
                {cartCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-[11px] font-bold text-white bg-[#9C5B6F] rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            ) : (
              /* Admin Header Controls */
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#FAF0F4] text-[#7A3F51] border border-[#E9D9CD] text-xs font-semibold transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#9C5B6F]" />
                  <span className="hidden sm:inline">Ver Loja Virtual</span>
                </Link>

                {adminUser && (
                  <div className="flex items-center gap-2.5 bg-[#FAF7F8] px-3 py-1.5 rounded-full border border-[#E9D9CD]">
                    <div className="w-7 h-7 rounded-full overflow-hidden relative ring-1 ring-[#C69A76]">
                      <Image 
                        src={adminUser.avatar} 
                        alt={adminUser.name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="text-left hidden md:block">
                      <div className="text-xs font-bold text-[#39313A]">{adminUser.name}</div>
                      <div className="text-[10px] text-[#C69A76] font-bold flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
                        {adminUser.role}
                      </div>
                    </div>
                  </div>
                )}

                {onLogoutAdmin && (
                  <button
                    onClick={onLogoutAdmin}
                    className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                    title="Sair do Painel Admin"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
