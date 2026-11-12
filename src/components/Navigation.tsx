"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Search,
  Bell,
  ChevronDown,
  Users,
  AlertTriangle,
  ShoppingCart,
  RotateCcw,
  CheckCheck,
  Lock,
  FileText,
  Power,
  Globe,
  Wrench,
  X
} from "lucide-react";
import { SystemUser, ProductCategory, Product, Order } from "@/types";
import { STORE_CONFIG } from "@/lib/data";
import { useBiaMakes } from "@/context/BiaMakesContext";

interface NavigationProps {
  variant?: 'storefront' | 'admin';
  cartCount: number;
  onOpenCart?: () => void;
  adminUser?: SystemUser;
  onLogoutAdmin?: () => void;
  onOpenSpotlight?: () => void;
  crmActiveTab?: string;
  onNavigateTab?: (tab: string) => void;
  products?: Product[];
  orders?: Order[];
  selectedCategory?: ProductCategory | 'Todos';
  onSelectCategory?: (category: ProductCategory | 'Todos') => void;
}

export function Navigation({
  variant = 'storefront',
  cartCount,
  onOpenCart,
  adminUser,
  onLogoutAdmin,
  onOpenSpotlight,
  crmActiveTab,
  onNavigateTab,
  products = [],
  orders = [],
  selectedCategory = 'Todos',
  onSelectCategory,
}: NavigationProps) {
  const { isMaintenanceMode, maintenanceMessage, setMaintenanceMode } = useBiaMakes();
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [customMaintMsg, setCustomMaintMsg] = useState(maintenanceMessage || "");

  useEffect(() => {
    setCustomMaintMsg(maintenanceMessage || "");
  }, [maintenanceMessage]);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  // Carrega IDs lidos persistidos no localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("biamakes_read_notifications");
      if (stored) {
        setReadNotificationIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Erro ao carregar notificações lidas:", e);
    }
  }, []);

  const saveReadNotificationIds = (ids: string[]) => {
    setReadNotificationIds(ids);
    try {
      localStorage.setItem("biamakes_read_notifications", JSON.stringify(ids));
    } catch (e) {
      console.error("Erro ao salvar notificações lidas:", e);
    }
  };

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Permissão: apenas Gerente para cima (GERENTE ou ADMIN) vê "Importar Planilhas" e "Usuários & Perfis"
  const isManagerOrAbove = adminUser?.role === 'ADMIN' || adminUser?.role === 'GERENTE';

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lista dinâmica de notificações do CRM
  const notifications = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      description: string;
      time: string;
      type: 'warning' | 'refund' | 'order' | 'sync';
      targetTab: string;
    }> = [];

    // 1. Devoluções ou Cancelamentos recentes
    orders
      .filter((o) => o.status === 'DEVOLUCAO' || o.status === 'CANCELADO')
      .slice(0, 3)
      .forEach((o) => {
        items.push({
          id: `refund-${o.id}-${o.status}`,
          title: o.status === 'DEVOLUCAO' ? `Devolução Registrada (${o.orderNumber})` : `Pedido Cancelado (${o.orderNumber})`,
          description: `Cliente ${o.customerName} • Estoque retornado e valor estornado do financeiro.`,
          time: 'Agora',
          type: 'refund',
          targetTab: 'orders',
        });
      });

    // 2. Produtos com estoque crítico (abaixo ou igual ao estoque de segurança)
    products
      .filter((p) => p.physicalStock - p.reservedStock <= p.minStock)
      .slice(0, 3)
      .forEach((p) => {
        const disp = Math.max(0, p.physicalStock - p.reservedStock);
        items.push({
          id: `lowstock-${p.id}`,
          title: `Alerta de Estoque Baixo: ${p.sku}`,
          description: `${p.name} possui apenas ${disp} un disponíveis (Mín: ${p.minStock} un).`,
          time: 'Há 10 min',
          type: 'warning',
          targetTab: 'stock',
        });
      });

    // 3. Pedidos em separação aguardando envio
    orders
      .filter((o) => o.status === 'SEPARACAO' || o.status === 'PAGO')
      .slice(0, 2)
      .forEach((o) => {
        items.push({
          id: `order-pending-${o.id}`,
          title: `Pedido Aguardando Envio (${o.orderNumber})`,
          description: `Canal ${o.channel.replace('_', ' ')} • Cliente: ${o.customerName}`,
          time: 'Hoje',
          type: 'order',
          targetTab: 'orders',
        });
      });

    return items;
  }, [orders, products]);

  const unreadCount = notifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  const markAllAsRead = () => {
    saveReadNotificationIds(Array.from(new Set([...readNotificationIds, ...notifications.map((n) => n.id)])));
  };
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-bia-nude/80 shadow-soft transition-all">
      {/* Top Notice Bar */}
      <div className="bg-gradient-to-r from-bia-pink via-bia-offwhite to-bia-lilas px-4 py-1.5 text-xs text-bia-text border-b border-bia-nude/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-bia-rosegold animate-pulse" />
            <span className="font-medium">
              {variant === 'admin'
                ? 'Ambiente Administrativo Criptografado — Sincronização Multicanal Ativa'
                : `Frete Grátis nas compras acima de R$ ${STORE_CONFIG.freeShippingThreshold},00 para todo o Brasil!`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href={STORE_CONFIG.instagramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-bia-marsala hover:text-bia-marsala-dark transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>{STORE_CONFIG.instagramHandle}</span>
            </a>
            <span className="hidden md:inline text-bia-nude">|</span>
            <span className="hidden md:flex items-center gap-1 text-bia-text/80 font-medium">
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
            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-bia-rosegold/60 shadow-glow group-hover:scale-105 transition-transform">
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
                <span className="font-display text-2xl tracking-tight font-extrabold text-bia-marsala-dark">
                  Bia
                </span>
                <span className="font-display text-xl tracking-widest text-bia-marsala font-semibold">
                  MAKE
                </span>
                {variant === 'admin' && (
                  <span className="ml-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-bia-marsala text-white rounded-full">
                    CRM / ERP
                  </span>
                )}
              </div>
              <p className="text-[11px] tracking-wider uppercase text-bia-rosegold-dark font-bold">
                {variant === 'admin' ? 'Central de Gestão Integrada' : 'Cosméticos & Alta Beleza'}
              </p>
            </div>
          </Link>

          {/* Center Navigation Links (Customer Storefront Only) */}
          {variant === 'storefront' && (
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-bia-text/85">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory?.('Todos');
                  const el = document.getElementById('catalogo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`transition-colors cursor-pointer ${
                  selectedCategory === 'Todos' ? 'text-bia-marsala font-bold underline underline-offset-4' : 'hover:text-bia-marsala'
                }`}
              >
                Catálogo Oficial
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory?.('Rosto');
                  const el = document.getElementById('catalogo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`transition-colors cursor-pointer ${
                  selectedCategory === 'Rosto' ? 'text-[#9C5B6F] font-bold underline underline-offset-4' : 'hover:text-[#9C5B6F]'
                }`}
              >
                Rosto & Bases HD
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory?.('Lábios');
                  const el = document.getElementById('catalogo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`transition-colors cursor-pointer ${
                  selectedCategory === 'Lábios' ? 'text-[#9C5B6F] font-bold underline underline-offset-4' : 'hover:text-[#9C5B6F]'
                }`}
              >
                Lábios & Batons
              </button>
              <a href="#redes-canais" className="hover:text-[#9C5B6F] transition-colors flex items-center gap-1">
                <span>Canais & Redes</span>
              </a>
            </nav>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {variant === 'storefront' ? (
              <button
                id="header-cart-button"
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
              <div className="flex items-center gap-2.5">
                {/* Ícones de Pesquisa (Spotlight) e Notificações lado a lado */}
                {onOpenSpotlight && (
                  <button
                    type="button"
                    onClick={onOpenSpotlight}
                    className="p-2.5 rounded-full bg-white hover:bg-[#FAF0F4] text-[#7A3F51] border border-[#E9D9CD] transition-all shadow-sm flex items-center justify-center cursor-pointer group"
                    title="Abrir Spotlight / Comandos (Ctrl+K)"
                    aria-label="Abrir Spotlight (Ctrl+K)"
                  >
                    <Search className="w-4 h-4 text-[#9C5B6F] group-hover:scale-110 transition-transform" />
                  </button>
                )}

                {/* Ícone fixo de Registro de Alterações exclusivo para eduardo.nunes ao lado da lupa */}
                {adminUser?.username === "eduardo.nunes" && (
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("biamakes-open-change-log"));
                    }}
                    className="relative p-2.5 rounded-full bg-[#FAF0F4] hover:bg-[#F5DDE5] text-[#7A3F51] border border-[#9C5B6F]/40 transition-all shadow-sm flex items-center justify-center cursor-pointer group"
                    title="Ver Histórico de Alterações do Sistema & Reversões"
                    aria-label="Histórico de alterações"
                  >
                    <FileText className="w-4 h-4 text-[#7A3F51] group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                  </button>
                )}

                {/* Ícone de Notificações ao lado do Ícone de Pesquisa e de "Ver Loja Virtual" */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen((prev) => !prev);
                      setIsUserMenuOpen(false);
                    }}
                    className={`relative p-2.5 rounded-full border transition-all shadow-sm cursor-pointer ${
                      isNotificationsOpen
                        ? "bg-[#9C5B6F] text-white border-[#9C5B6F]"
                        : "bg-white hover:bg-[#FAF0F4] text-[#7A3F51] border-[#E9D9CD]"
                    }`}
                    title="Central de Notificações"
                    aria-label="Abrir notificações"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-rose-600 rounded-full ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Painel Dropdown de Notificações */}
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-3xl border border-[#E9D9CD] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-3 bg-gradient-to-r from-[#FAF0F4] to-[#FAF7F8] border-b border-[#E9D9CD] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-[#9C5B6F]" />
                          <span className="text-xs font-bold text-[#39313A]">
                            Notificações do Sistema
                          </span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#9C5B6F] text-white rounded-full">
                              {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] font-semibold text-[#9C5B6F] hover:text-[#7A3F51] flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Ler todas</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[#E9D9CD]/50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-gray-500">
                            Nenhuma notificação pendente no momento.
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isRead = readNotificationIds.includes(notif.id);
                            return (
                              <button
                                key={notif.id}
                                type="button"
                                onClick={() => {
                                  if (!isRead) {
                                    saveReadNotificationIds(Array.from(new Set([...readNotificationIds, notif.id])));
                                  }
                                  onNavigateTab?.(notif.targetTab);
                                  setIsNotificationsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-[#FAF7F8] transition-colors flex items-start gap-3 cursor-pointer ${
                                  !isRead ? "bg-[#FAF0F4]/40" : ""
                                }`}
                              >
                                <div
                                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                    notif.type === "refund"
                                      ? "bg-red-100 text-red-700"
                                      : notif.type === "warning"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-[#F5DDE5] text-[#7A3F51]"
                                  }`}
                                >
                                  {notif.type === "refund" ? (
                                    <RotateCcw className="w-4 h-4" />
                                  ) : notif.type === "warning" ? (
                                    <AlertTriangle className="w-4 h-4" />
                                  ) : (
                                    <ShoppingCart className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-[#39313A] truncate">
                                      {notif.title}
                                    </span>
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                      {notif.time}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#39313A]/75 mt-0.5 line-clamp-2">
                                    {notif.description}
                                  </p>
                                </div>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status da Loja Virtual (Online / Em Manutenção) com controle rápido */}
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isMaintenanceMode
                      ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 ring-2 ring-amber-400/30 animate-pulse"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                  title={
                    isMaintenanceMode
                      ? "Loja em Manutenção (Clientes visualizam a tela Voltamos Já!). Clique para configurar ou reabrir."
                      : "Loja Virtual Online para compras. Clique para ativar manutenção se for atualizar."
                  }
                >
                  {isMaintenanceMode ? (
                    <>
                      <Wrench className="w-3.5 h-3.5 text-amber-800" />
                      <span className="hidden md:inline">Loja em Manutenção</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="hidden md:inline">Loja Online</span>
                    </>
                  )}
                </button>

                <Link
                  href="/"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#FAF0F4] text-[#7A3F51] border border-[#E9D9CD] text-xs font-semibold transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#9C5B6F]" />
                  <span className="hidden sm:inline">Ver Loja Virtual</span>
                </Link>

                {/* Botão Clicável do Usuário Logado (Abre menu com "Importar Planilhas" e "Usuários & Perfis" para Gerente ou acima) */}
                {adminUser && (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen((prev) => !prev);
                        setIsNotificationsOpen(false);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        isUserMenuOpen || crmActiveTab === "import" || crmActiveTab === "users"
                          ? "bg-[#FAF0F4] border-[#9C5B6F] shadow-sm ring-2 ring-[#9C5B6F]/20"
                          : "bg-[#FAF7F8] hover:bg-[#FAF0F4] border-[#E9D9CD]"
                      }`}
                      title="Clique para abrir opções do perfil e gestão"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden relative ring-1 ring-[#C69A76]">
                        <Image 
                          src={adminUser.avatar} 
                          alt={adminUser.name} 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      <div className="text-left hidden md:block">
                        <div className="text-xs font-bold text-[#39313A] flex items-center gap-1">
                          <span>{adminUser.name}</span>
                        </div>
                        <div className="text-[10px] text-[#C69A76] font-bold flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
                          {adminUser.role}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#7A3F51] transition-transform duration-200 ${
                          isUserMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown do Perfil do Usuário */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-3xl border border-[#E9D9CD] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-3 bg-gradient-to-r from-[#FAF0F4] to-[#FAF7F8] border-b border-[#E9D9CD]">
                          <div className="text-xs font-bold text-[#39313A]">{adminUser.name}</div>
                          <div className="text-[11px] text-[#7A3F51] font-medium">@{adminUser.username}</div>
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9C5B6F] text-white">
                            <UserCheck className="w-3 h-3" />
                            <span>Nível: {adminUser.role}</span>
                          </div>
                        </div>

                        {isManagerOrAbove ? (
                          <div className="p-2 space-y-1">
                            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C69A76]">
                              Ferramentas de Gerência
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateTab?.("users");
                                setIsUserMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                crmActiveTab === "users"
                                  ? "bg-[#9C5B6F] text-white shadow-sm"
                                  : "text-[#39313A] hover:bg-[#FAF0F4] hover:text-[#7A3F51]"
                              }`}
                            >
                              <Users className="w-4 h-4 shrink-0" />
                              <div className="text-left">
                                <span className="block">Usuários & Perfis</span>
                                <span className={`text-[10px] font-normal ${crmActiveTab === "users" ? "text-white/80" : "text-gray-500"}`}>
                                  Acessos, cargos e senhas
                                </span>
                              </div>
                            </button>
                          </div>
                        ) : (
                          <div className="p-3.5 text-center space-y-1">
                            <div className="inline-flex p-2 rounded-full bg-gray-100 text-gray-500">
                              <Lock className="w-4 h-4" />
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">
                              Acesso a <strong>Usuários & Perfis</strong> é exclusivo para cargos de <strong>Gerente</strong> ou superior.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {onLogoutAdmin && (
                  <button
                    onClick={onLogoutAdmin}
                    className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
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

      {/* Modal de Controle do Modo Manutenção & Tela "Voltamos Já!" */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#E9D9CD] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative animate-in zoom-in-95 duration-200">
            
            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-[#39313A] hover:bg-black/5 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="flex items-start gap-4">
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                isMaintenanceMode ? "bg-amber-100 text-amber-800" : "bg-[#FAF0F4] text-[#9C5B6F]"
              }`}>
                {isMaintenanceMode ? <Wrench className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-extrabold text-[#39313A]">
                  Controle da Loja & Modo Manutenção
                </h3>
                <p className="text-xs text-[#39313A]/70 leading-relaxed">
                  Gerencie a visibilidade pública da vitrine. Ao ativar, todos os clientes visualizarão a tela com a logo oficial e a barra &quot;Voltamos Já!&quot;.
                </p>
              </div>
            </div>

            {/* Card de Status Atual */}
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
              isMaintenanceMode
                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  isMaintenanceMode ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                }`} />
                <span>
                  Status Atual: <strong>{isMaintenanceMode ? "Loja em Manutenção (Voltamos Já)" : "Loja Aberta e Online"}</strong>
                </span>
              </div>
              <a
                href="/maintenance"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] underline font-bold text-[#7A3F51] hover:text-[#9C5B6F] flex items-center gap-1"
              >
                <span>Ver prévia da tela</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Configuração de Mensagem Opcional */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#39313A]">
                Mensagem personalizada para os clientes (opcional)
              </label>
              <textarea
                value={customMaintMsg}
                onChange={(e) => setCustomMaintMsg(e.target.value)}
                placeholder="Ex: Estamos atualizando nosso estoque com novas bases HD e paletas de sombras! Voltamos em instantes."
                rows={3}
                className="w-full p-3 rounded-2xl bg-[#FAF7F8] border border-[#E9D9CD] focus:outline-none focus:border-[#9C5B6F] text-xs font-medium text-[#39313A] resize-none"
              />
              <p className="text-[10px] text-gray-500">
                Se deixar em branco, será exibida a mensagem padrão oficial da marca Bia Makes.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-[#E9D9CD]/60">
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#E9D9CD] text-xs font-bold text-[#39313A] hover:bg-[#FAF7F8] transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {isMaintenanceMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setMaintenanceMode(false, "");
                    setIsMaintenanceModalOpen(false);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>Reabrir Loja Oficial para Clientes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMaintenanceMode(true, customMaintMsg);
                    setIsMaintenanceModalOpen(false);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#9C5B6F] to-[#7A3F51] hover:opacity-95 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Ativar Modo Manutenção (&quot;Voltamos Já!&quot;)</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
