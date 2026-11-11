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
  FileSpreadsheet,
  Users,
  AlertTriangle,
  ShoppingCart,
  RotateCcw,
  CheckCheck,
  Lock,
  FileText
} from "lucide-react";
import { SystemUser, ProductCategory, Product, Order, MarketplaceChannel } from "@/types";

interface NavigationProps {
  variant?: 'storefront' | 'admin';
  cartCount: number;
  onOpenCart?: () => void;
  isAdminAuthenticated?: boolean;
  adminUser?: SystemUser;
  onLogoutAdmin?: () => void;
  onOpenSpotlight?: () => void;
  crmActiveTab?: string;
  onNavigateTab?: (tab: string) => void;
  products?: Product[];
  orders?: Order[];
  channels?: MarketplaceChannel[];
  selectedCategory?: ProductCategory | 'Todos';
  onSelectCategory?: (category: ProductCategory | 'Todos') => void;
}

export function Navigation({
  variant = 'storefront',
  cartCount,
  onOpenCart,
  isAdminAuthenticated = false,
  adminUser,
  onLogoutAdmin,
  onOpenSpotlight,
  crmActiveTab,
  onNavigateTab,
  products = [],
  orders = [],
  channels = [],
  selectedCategory = 'Todos',
  onSelectCategory,
}: NavigationProps) {
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
              <button
                type="button"
                onClick={() => {
                  onSelectCategory?.('Todos');
                  const el = document.getElementById('catalogo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`transition-colors cursor-pointer ${
                  selectedCategory === 'Todos' ? 'text-[#9C5B6F] font-bold underline underline-offset-4' : 'hover:text-[#9C5B6F]'
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
                                onNavigateTab?.("import");
                                setIsUserMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                crmActiveTab === "import"
                                  ? "bg-[#9C5B6F] text-white shadow-sm"
                                  : "text-[#39313A] hover:bg-[#FAF0F4] hover:text-[#7A3F51]"
                              }`}
                            >
                              <FileSpreadsheet className="w-4 h-4 shrink-0" />
                              <div className="text-left">
                                <span className="block">Importar Planilhas</span>
                                <span className={`text-[10px] font-normal ${crmActiveTab === "import" ? "text-white/80" : "text-gray-500"}`}>
                                  Excel & CSV em lote
                                </span>
                              </div>
                            </button>

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
                              Opções de <strong>Importar Planilhas</strong> e <strong>Usuários & Perfis</strong> são exclusivas para cargos de <strong>Gerente</strong> ou superior.
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
    </header>
  );
}
