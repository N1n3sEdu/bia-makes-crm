"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Product,
  ProductVariation,
  StockMovement,
  Order,
  OrderItem,
  OrderStatus,
  MarketplaceChannel,
  FinancialMetric,
  SystemUser,
} from "@/types";
import {
  initialProducts,
  initialStockMovements,
  initialOrders,
  initialChannels,
  initialFinancial,
  initialUsers,
  currentUser as defaultAdminUser,
} from "@/lib/data";
import { trackEvent } from "@/lib/analytics/track";
import { resolveOrderCompanyShippingCost } from "@/lib/utils";

export interface CartItem {
  product: Product;
  selectedVariation?: ProductVariation;
  quantity: number;
}

export interface StorefrontOrderData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  paymentMethod: 'PIX' | 'CARTAO' | 'WHATSAPP';
  channel: 'SITE' | 'WHATSAPP';
  shippingAmount: number;
  discountAmount: number;
  items?: CartItem[];
  companyShippingCost?: number;
  shippingCarrier?: string;
  shippingServiceDays?: string;
  shippingCep?: string;
  isFreeShippingSubsidized?: boolean;
}

interface BiaMakesContextType {
  products: Product[];
  movements: StockMovement[];
  orders: Order[];
  channels: MarketplaceChannel[];
  financial: FinancialMetric;
  users: SystemUser[];
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  adminUser: SystemUser;
  crmActiveTab: string;
  setCrmActiveTab: (tab: string) => void;
  isSpotlightOpen: boolean;
  setIsSpotlightOpen: React.Dispatch<React.SetStateAction<boolean>>;
  uxXrayMode: boolean;
  setUxXrayMode: React.Dispatch<React.SetStateAction<boolean>>;
  activeScopeName: string;
  setActiveScopeName: (scope: string) => void;
  loginAdmin: (username: string, password: string) => { success: boolean; message?: string };
  logoutAdmin: () => void;
  switchAdminProfile: (user: SystemUser) => void;
  addUser: (newUser: SystemUser) => void;
  updateUser: (updated: SystemUser) => void;
  deleteUser: (id: string) => void;
  addToCart: (product: Product, variation?: ProductVariation, openCart?: boolean) => boolean;
  updateCartQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  addProduct: (newProduct: Product) => void;
  updateProduct: (updated: Product) => void;
  deleteProduct: (id: string) => void;
  importProducts: (imported: Product[]) => void;
  addMovement: (newMovement: StockMovement) => void;
  updateProductStock: (productId: string, newPhysical: number, variationId?: string) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  createStorefrontOrder: (orderData: StorefrontOrderData) => Order;
  syncChannel: (channelId: string) => void;
  syncAllChannels: () => void;
  updateChannel: (updated: MarketplaceChannel) => void;
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  setMaintenanceMode: (active: boolean, message?: string) => void;
  isSystemOffline: boolean;
}

const BiaMakesContext = createContext<BiaMakesContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: "biamakes_products_v4",
  MOVEMENTS: "biamakes_movements_v2",
  ORDERS: "biamakes_orders_v4",
  CHANNELS: "biamakes_channels_v2",
  USERS: "biamakes_users_v3",
  ADMIN_AUTH: "biamakes_admin_auth_v3",
  ADMIN_USER: "biamakes_admin_user_v3",
  CART: "biamakes_cart_v2",
  UPDATED_AT: "biamakes_state_updated_at_v4",
  LEGACY_CLEANED: "biamakes_legacy_cleaned_v4",
  MAINTENANCE_MODE: "biamakes_maintenance_mode_v1",
  MAINTENANCE_MESSAGE: "biamakes_maintenance_message_v1",
};

export function BiaMakesProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] = useState<StockMovement[]>(initialStockMovements);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [channels, setChannels] = useState<MarketplaceChannel[]>(initialChannels);
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);

  // Dynamically compute financial metrics directly based on active orders, real product costs and channel fees
  const financial: FinancialMetric = useMemo(() => {
    // Active orders considering genuine completed/in-progress sales
    const activeStatuses: OrderStatus[] = ["PAGO", "SEPARACAO", "ENVIADO", "CONCLUIDO"];
    const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));
    const refundedOrders = orders.filter(
      (o) => o.status === "DEVOLUCAO" || o.status === "CANCELADO"
    );

    const refundedAmount = refundedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const refundedOrdersCount = refundedOrders.length;

    // 1. Receita Bruta real dos pedidos ativos
    const grossRevenue = activeOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    // Map channels to easily get registered real feePercentage
    const channelFeeMap: Record<string, number> = {};
    channels.forEach((c) => {
      channelFeeMap[c.code] = typeof c.feePercentage === "number" ? c.feePercentage : 0;
    });

    // 2. Comissões por canal calculadas com a taxa real cadastrada de cada canal
    let marketplaceFees = 0;
    activeOrders.forEach((o) => {
      const channelFeePct = channelFeeMap[o.channel] ?? 0;
      marketplaceFees += o.totalAmount * (channelFeePct / 100);
    });

    // 3. CMV real calculado pelo custo real de cada SKU cadastrado
    let cmv = 0;
    let totalCompanyShippingCost = 0;
    let subsidizedFreeShippingCost = 0;
    let customerPaidShippingTotal = 0;

    activeOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find(
          (p) => p.id === item.productId || p.sku === item.sku
        );
        // Custo cadastrado real do produto ou fallback prudencial baseado no preço
        const unitCost = prod && typeof prod.costPrice === "number" ? prod.costPrice : item.price * 0.38;
        cmv += unitCost * item.quantity;
      });

      const companyShip = resolveOrderCompanyShippingCost(o);
      totalCompanyShippingCost += companyShip;

      const customerShip = typeof o.shippingAmount === "number" ? o.shippingAmount : 0;
      customerPaidShippingTotal += customerShip;
      if (customerShip === 0 || o.isFreeShippingSubsidized) {
        subsidizedFreeShippingCost += companyShip;
      }
    });

    totalCompanyShippingCost = Math.round(totalCompanyShippingCost * 100) / 100;
    subsidizedFreeShippingCost = Math.round(subsidizedFreeShippingCost * 100) / 100;
    customerPaidShippingTotal = Math.round(customerPaidShippingTotal * 100) / 100;

    // Despesas operacionais do período (proporcionais ou base do negócio quando há vendas)
    const operatingExpenses = grossRevenue > 0 ? initialFinancial.operatingExpenses : 0;

    // 4. Lucro Líquido Real descontando obrigatoriamente o Custo Real do Frete pago pela empresa
    const netProfit =
      grossRevenue > 0
        ? grossRevenue - marketplaceFees - cmv - totalCompanyShippingCost - operatingExpenses
        : 0;

    const ordersCount = activeOrders.length;
    const profitMargin =
      grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(2)) : 0;
    const averageTicket =
      ordersCount > 0 ? Number((grossRevenue / ordersCount).toFixed(2)) : 0;

    return {
      grossRevenue,
      marketplaceFees,
      cmv,
      operatingExpenses,
      netProfit,
      profitMargin,
      ordersCount,
      averageTicket,
      refundedAmount,
      refundedOrdersCount,
      totalCompanyShippingCost,
      subsidizedFreeShippingCost,
      customerPaidShippingTotal,
    };
  }, [orders, products, channels]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<SystemUser>(defaultAdminUser);
  const [crmActiveTab, setCrmActiveTab] = useState<string>("dashboard");
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);
  const [uxXrayMode, setUxXrayMode] = useState<boolean>(false);
  const [activeScopeName, setActiveScopeName] = useState<string>("Matriz Bia Makes — Todos os Canais");
  const [hydrated, setHydrated] = useState(false);

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(() => {
    if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
      return true;
    }
    return false;
  });
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>("");
  const [isSystemOffline, setIsSystemOffline] = useState<boolean>(false);
  const isMaintenanceModeRef = useRef<boolean>(isMaintenanceMode);
  const maintenanceMessageRef = useRef<string>(maintenanceMessage);

  useEffect(() => { isMaintenanceModeRef.current = isMaintenanceMode; }, [isMaintenanceMode]);
  useEffect(() => { maintenanceMessageRef.current = maintenanceMessage; }, [maintenanceMessage]);

  const lastUpdatedAtRef = useRef<number>(0);
  const productsRef = useRef<Product[]>(products);
  const movementsRef = useRef<StockMovement[]>(movements);
  const ordersRef = useRef<Order[]>(orders);
  const channelsRef = useRef<MarketplaceChannel[]>(channels);

  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { movementsRef.current = movements; }, [movements]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { channelsRef.current = channels; }, [channels]);

  const persistSnapshot = useCallback((next: {
    products?: Product[];
    movements?: StockMovement[];
    orders?: Order[];
    channels?: MarketplaceChannel[];
  }) => {
    const now = Date.now();
    lastUpdatedAtRef.current = now;

    const finalProducts = next.products ?? productsRef.current;
    const finalMovements = next.movements ?? movementsRef.current;
    const finalOrders = next.orders ?? ordersRef.current;
    const finalChannels = next.channels ?? channelsRef.current;

    productsRef.current = finalProducts;
    movementsRef.current = finalMovements;
    ordersRef.current = finalOrders;
    channelsRef.current = finalChannels;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(finalProducts));
        localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(finalMovements));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(finalOrders));
        localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(finalChannels));
        localStorage.setItem(STORAGE_KEYS.UPDATED_AT, String(now));
      } catch (e) {
        console.error("Erro ao persistir snapshot no localStorage", e);
      }

      try {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("biamakes_store_sync");
          bc.postMessage({ updatedAt: now });
          bc.close();
        }
      } catch {
        // Ignora caso BroadcastChannel não esteja disponível
      }

      fetch("/api/store-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updatedAt: now,
          products: finalProducts,
          movements: finalMovements,
          orders: finalOrders,
          channels: finalChannels,
          maintenanceMode: isMaintenanceModeRef.current,
          maintenanceMessage: maintenanceMessageRef.current,
        }),
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  // Helper to re-read updated data from storage
  const reloadFromStorage = useCallback(() => {
    try {
      const savedUpdatedAt = Number(localStorage.getItem(STORAGE_KEYS.UPDATED_AT) || "0");
      if (savedUpdatedAt > lastUpdatedAtRef.current) {
        lastUpdatedAtRef.current = savedUpdatedAt;
      }

      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (savedMovements) setMovements(JSON.parse(savedMovements));

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedChannels = localStorage.getItem(STORAGE_KEYS.CHANNELS);
      if (savedChannels) setChannels(JSON.parse(savedChannels));

      const savedMaint = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_MODE);
      if (savedMaint !== null) {
        setIsMaintenanceMode(JSON.parse(savedMaint));
      }

      const savedMsg = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_MESSAGE);
      if (savedMsg !== null) {
        setMaintenanceMessage(savedMsg);
      }

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) {
        const parsed: SystemUser[] = JSON.parse(savedUsers);
        const mIdx = parsed.findIndex((u) => u.username.toLowerCase() === "eduardo.nunes");
        if (mIdx !== -1) {
          parsed[mIdx] = {
            ...parsed[mIdx],
            password: "Admin@2026!",
            isActive: true,
            role: "ADMIN",
            isMaster: true,
          };
        }
        setUsers(parsed);
      }
    } catch (e) {
      console.error("Erro ao sincronizar do localStorage", e);
    }
  }, []);

  const pullLatestFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/store-state", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const localUpdatedAt = Number(localStorage.getItem(STORAGE_KEYS.UPDATED_AT) || lastUpdatedAtRef.current || 0);

      if (data?.initialized && typeof data.updatedAt === "number" && data.updatedAt > localUpdatedAt) {
        lastUpdatedAtRef.current = data.updatedAt;
        localStorage.setItem(STORAGE_KEYS.UPDATED_AT, String(data.updatedAt));

        if (Array.isArray(data.products) && data.products.length > 0) {
          productsRef.current = data.products;
          setProducts(data.products);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
        }
        if (Array.isArray(data.movements)) {
          movementsRef.current = data.movements;
          setMovements(data.movements);
          localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(data.movements));
        }
        if (Array.isArray(data.orders)) {
          ordersRef.current = data.orders;
          setOrders(data.orders);
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
        }
        if (Array.isArray(data.channels) && data.channels.length > 0) {
          channelsRef.current = data.channels;
          setChannels(data.channels);
          localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(data.channels));
        }
        if (typeof data.maintenanceMode === "boolean") {
          isMaintenanceModeRef.current = data.maintenanceMode;
          setIsMaintenanceMode(data.maintenanceMode);
          localStorage.setItem(STORAGE_KEYS.MAINTENANCE_MODE, JSON.stringify(data.maintenanceMode));
        }
        if (typeof data.maintenanceMessage === "string") {
          maintenanceMessageRef.current = data.maintenanceMessage;
          setMaintenanceMessage(data.maintenanceMessage);
          localStorage.setItem(STORAGE_KEYS.MAINTENANCE_MESSAGE, data.maintenanceMessage);
        }
      } else if (localUpdatedAt > (data?.updatedAt || 0)) {
        // O cliente possui alterações locais mais recentes ainda não enviadas ao servidor
        fetch("/api/store-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            updatedAt: localUpdatedAt,
            products: productsRef.current,
            movements: movementsRef.current,
            orders: ordersRef.current,
            channels: channelsRef.current,
            maintenanceMode: isMaintenanceModeRef.current,
            maintenanceMessage: maintenanceMessageRef.current,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Sem conexão com API: segue usando localStorage normalmente
    }
  }, []);

  // Load persisted state from localStorage (com limpeza única somente de chaves antigas v1/v2/v3)
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.LEGACY_CLEANED)) {
        localStorage.removeItem("biamakes_orders_v2");
        localStorage.removeItem("biamakes_orders_v3");
        localStorage.removeItem("biamakes_orders");
        localStorage.removeItem("biamakes_products_v2");
        localStorage.removeItem("biamakes_products_v3");
        localStorage.setItem(STORAGE_KEYS.LEGACY_CLEANED, "true");
      }

      const savedUpdatedAt = Number(localStorage.getItem(STORAGE_KEYS.UPDATED_AT) || "0");
      if (savedUpdatedAt > 0) {
        lastUpdatedAtRef.current = savedUpdatedAt;
      }

      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        productsRef.current = parsedProducts;
        setProducts(parsedProducts);
      }

      const savedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (savedMovements) {
        const parsedMovements = JSON.parse(savedMovements);
        movementsRef.current = parsedMovements;
        setMovements(parsedMovements);
      }

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        ordersRef.current = parsedOrders;
        setOrders(parsedOrders);
      }

      const savedChannels = localStorage.getItem(STORAGE_KEYS.CHANNELS);
      if (savedChannels) {
        const parsedChannels = JSON.parse(savedChannels);
        channelsRef.current = parsedChannels;
        setChannels(parsedChannels);
      }

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) {
        let parsedUsers: SystemUser[] = JSON.parse(savedUsers);
        // Garante que o Master Admin eduardo.nunes SEMPRE exista, esteja ativo e com a senha oficial
        const masterIdx = parsedUsers.findIndex(
          (u) => u.username.toLowerCase() === "eduardo.nunes"
        );
        if (masterIdx === -1) {
          parsedUsers = [initialUsers[0], ...parsedUsers];
        } else {
          parsedUsers[masterIdx] = {
            ...parsedUsers[masterIdx],
            name: "Eduardo Nunes",
            username: "eduardo.nunes",
            password: "Admin@2026!",
            email: "eduardo.nunes@biamake.com.br",
            role: "ADMIN",
            isActive: true,
            isMaster: true,
          };
        }
        setUsers(parsedUsers);
      }

      const savedAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      if (savedAuth === "true") setIsAdminAuthenticated(true);

      const savedUser = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      if (savedUser) setAdminUser(JSON.parse(savedUser));

      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedMaint = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_MODE);
      if (savedMaint !== null) {
        try {
          const parsedMaint = JSON.parse(savedMaint);
          isMaintenanceModeRef.current = parsedMaint;
          setIsMaintenanceMode(parsedMaint);
        } catch {}
      }

      const savedMsg = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_MESSAGE);
      if (savedMsg) {
        maintenanceMessageRef.current = savedMsg;
        setMaintenanceMessage(savedMsg);
      }
    } catch (e) {
      console.error("Failed to load localStorage state", e);
    } finally {
      setHydrated(true);
      pullLatestFromServer();
    }
  }, [pullLatestFromServer]);

  // Listener para conexao de internet (online/offline)
  useEffect(() => {
    const handleOnline = () => setIsSystemOffline(false);
    const handleOffline = () => setIsSystemOffline(true);

    if (typeof window !== "undefined") {
      setIsSystemOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  // 1. Sincronização em tempo real entre abas / janelas / dispositivos
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.PRODUCTS ||
        e.key === STORAGE_KEYS.MOVEMENTS ||
        e.key === STORAGE_KEYS.ORDERS ||
        e.key === STORAGE_KEYS.CHANNELS ||
        e.key === STORAGE_KEYS.USERS ||
        e.key === STORAGE_KEYS.UPDATED_AT ||
        e.key === STORAGE_KEYS.MAINTENANCE_MODE ||
        e.key === STORAGE_KEYS.MAINTENANCE_MESSAGE
      ) {
        reloadFromStorage();
      }
    };

    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        reloadFromStorage();
        pullLatestFromServer();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel("biamakes_store_sync");
        bc.onmessage = () => {
          reloadFromStorage();
        };
      } catch {
        bc = null;
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      bc?.close();
    };
  }, [reloadFromStorage, pullLatestFromServer]);

  // 2. Sincronização periódica a cada 15 segundos para manter loja e admin alinhados
  useEffect(() => {
    const interval = setInterval(() => {
      pullLatestFromServer();
    }, 15000);

    return () => clearInterval(interval);
  }, [pullLatestFromServer]);

  // Save state changes to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {}
  }, [products, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch (e) {}
  }, [movements, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {}
  }, [orders, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
    } catch (e) {}
  }, [channels, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {}
  }, [users, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {}
  }, [cart, hydrated]);

  // Admin Login using Username & Password against CRM Users list
  const loginAdmin = (
    username: string,
    password: string
  ): { success: boolean; message?: string } => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Garantia Master Admin Eduardo Nunes (Credencial Oficial Inviolável)
    if (cleanUser === "eduardo.nunes" && cleanPass === "Admin@2026!") {
      const masterUser: SystemUser = {
        id: "user-master-1",
        name: "Eduardo Nunes",
        username: "eduardo.nunes",
        password: "Admin@2026!",
        email: "eduardo.nunes@biamake.com.br",
        role: "ADMIN",
        isActive: true,
        isMaster: true,
        avatar: "/logo.jpg",
        createdAt: "2026-11-01T08:00:00Z",
      };

      // Reativa e atualiza caso estivesse inativo no estado local
      setUsers((prev) => {
        const idx = prev.findIndex((u) => u.username.toLowerCase() === "eduardo.nunes");
        if (idx === -1) return [masterUser, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...masterUser };
        return next;
      });

      setAdminUser(masterUser);
      setIsAdminAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
      localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(masterUser));
      return { success: true };
    }

    const matched = users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (!matched) {
      return {
        success: false,
        message: "Usuário ou senha inválidos. Verifique suas credenciais.",
      };
    }

    if (!matched.isActive) {
      return {
        success: false,
        message: "Este usuário está desativado no CRM. Contate o Admin Master.",
      };
    }

    setAdminUser(matched);
    setIsAdminAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(matched));
    return { success: true };
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
  };

  // CRM Users Management
  const addUser = (newUser: SystemUser) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const updateUser = (updated: SystemUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (adminUser.id === updated.id) {
      setAdminUser(updated);
      localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(updated));
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id || u.isMaster));
  };

  // Cart Actions com validação estrita de estoque por tom/variação
  const addToCart = (product: Product, variation?: ProductVariation, openCart: boolean = true): boolean => {
    // Buscar produto e variação mais atualizados do estado
    const currentProd = products.find((p) => p.id === product.id) || product;
    const currentVar = variation
      ? currentProd.variations?.find((v) => v.id === variation.id) || variation
      : undefined;

    // Estoque disponível específico do tom escolhido ou geral do produto
    const availableStock = currentVar && typeof currentVar.stock === "number"
      ? currentVar.stock
      : Math.max(0, currentProd.physicalStock - currentProd.reservedStock);

    if (availableStock <= 0) {
      alert(`O tom selecionado "${currentVar?.name || currentProd.name}" está esgotado no momento.`);
      return false;
    }

    const existingItem = cart.find(
      (item) =>
        item.product.id === product.id &&
        item.selectedVariation?.id === currentVar?.id
    );

    if (existingItem && existingItem.quantity >= availableStock) {
      alert(`Você já adicionou a quantidade máxima disponível (${availableStock} un.) para o tom "${currentVar?.name || currentProd.name}".`);
      return false;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedVariation?.id === currentVar?.id
      );

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty >= availableStock) {
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
        };
        return updated;
      } else {
        return [...prev, { product: currentProd, selectedVariation: currentVar, quantity: 1 }];
      }
    });

    if (openCart) {
      setIsCartOpen(true);
    }
    const itemPrice = currentProd.promoPrice || currentProd.salePrice;
    trackEvent("add_to_cart", {
      product_sku: currentProd.sku,
      value_cents: Math.round(itemPrice * 100),
    });
    return true;
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCart((prev) => {
      if (!prev[index]) return prev;
      const item = prev[index];

      const currentProd = products.find((p) => p.id === item.product.id) || item.product;
      const currentVar = item.selectedVariation
        ? currentProd.variations?.find((v) => v.id === item.selectedVariation?.id) || item.selectedVariation
        : undefined;

      const availableStock = currentVar && typeof currentVar.stock === "number"
        ? currentVar.stock
        : Math.max(0, currentProd.physicalStock - currentProd.reservedStock);

      const updated = [...prev];
      const clampedQuantity = Math.max(1, Math.min(quantity, Math.max(1, availableStock)));

      updated[index] = {
        ...item,
        quantity: clampedQuantity,
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Product CRUD
  const addProduct = (newProduct: Product) => {
    const nextProducts = [newProduct, ...productsRef.current];
    const initMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: "ENTRADA",
      quantity: newProduct.physicalStock,
      previousStock: 0,
      currentStock: newProduct.physicalStock,
      reason: "Estoque inicial no cadastro do produto",
      operator: `${adminUser.name} (${adminUser.role})`,
      date: new Date().toISOString(),
    };
    const nextMovements = [initMovement, ...movementsRef.current];
    setProducts(nextProducts);
    setMovements(nextMovements);
    persistSnapshot({ products: nextProducts, movements: nextMovements });
  };

  const updateProduct = (updated: Product) => {
    const nextProducts = productsRef.current.map((p) => (p.id === updated.id ? updated : p));
    setProducts(nextProducts);
    persistSnapshot({ products: nextProducts });
  };

  const deleteProduct = (id: string) => {
    const nextProducts = productsRef.current.filter((p) => p.id !== id);
    setProducts(nextProducts);
    persistSnapshot({ products: nextProducts });
  };

  const importProducts = (imported: Product[]) => {
    const nextProducts = [...imported, ...productsRef.current];
    setProducts(nextProducts);
    persistSnapshot({ products: nextProducts });
  };

  const addMovement = (newMovement: StockMovement) => {
    const nextMovements = [newMovement, ...movementsRef.current];
    setMovements(nextMovements);
    persistSnapshot({ movements: nextMovements });
  };

  const updateProductStock = (productId: string, newPhysical: number, variationId?: string) => {
    const nextProducts = productsRef.current.map((p) => {
      if (p.id !== productId) return p;

      if (variationId && p.variations && p.variations.length > 0) {
        const targetVar = p.variations.find((v) => v.id === variationId);
        const oldVarStock = targetVar ? targetVar.stock : 0;
        const delta = newPhysical - oldVarStock;
        const updatedVars = p.variations.map((v) =>
          v.id === variationId ? { ...v, stock: Math.max(0, newPhysical) } : v
        );
        return {
          ...p,
          physicalStock: Math.max(0, p.physicalStock + delta),
          variations: updatedVars,
        };
      }

      return { ...p, physicalStock: Math.max(0, newPhysical) };
    });

    setProducts(nextProducts);
    persistSnapshot({ products: nextProducts });
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    // 1. Localiza o pedido com tolerância por id ou orderNumber, buscando no estado e no ref
    const targetOrder =
      orders.find((o) => o.id === orderId || o.orderNumber === orderId) ||
      ordersRef.current.find((o) => o.id === orderId || o.orderNumber === orderId);

    if (!targetOrder) {
      console.warn("[updateOrderStatus] Pedido não encontrado:", orderId);
      return;
    }

    const oldStatus = targetOrder.status;
    const isRefundStatus = (s: OrderStatus) => s === "DEVOLUCAO" || s === "CANCELADO";
    const isActiveSaleStatus = (s: OrderStatus) =>
      s === "PAGO" || s === "SEPARACAO" || s === "ENVIADO" || s === "CONCLUIDO";

    const operatorName = adminUser?.name || "Eduardo Nunes";
    const operatorRole = adminUser?.role || "ADMIN";
    const newMovements: StockMovement[] = [];

    const matchesOrderProduct = (prod: Product, it: OrderItem) =>
      it.productId === prod.id ||
      it.sku === prod.sku ||
      Boolean(prod.variations?.some((v) => v.sku === it.sku));

    const matchVariationItem = (v: ProductVariation, matchingItems: OrderItem[]) =>
      matchingItems
        .filter((it) => it.sku === v.sku || it.variationName === v.name)
        .reduce((sum, it) => sum + it.quantity, 0);

    const baseProducts = products.length > 0 ? products : productsRef.current;
    const nextProducts = baseProducts.map((prod) => {
      const matchingItems = (targetOrder.items || []).filter((it) => matchesOrderProduct(prod, it));
      if (matchingItems.length === 0) return prod;

      const qtyTotal = matchingItems.reduce((sum, it) => sum + it.quantity, 0);
      const previousStock = prod.physicalStock;
      const previousReserved = prod.reservedStock || 0;

      // 1. PENDENTE -> Ativo (PAGO, SEPARACAO, ENVIADO, CONCLUIDO): efetiva baixa física e libera reserva
      if (oldStatus === "PENDENTE" && isActiveSaleStatus(newStatus)) {
        const currentStock = Math.max(0, previousStock - qtyTotal);
        const currentReserved = Math.max(0, previousReserved - qtyTotal);

        newMovements.push({
          id: `mov-paid-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: "SAIDA",
          quantity: -qtyTotal,
          previousStock,
          currentStock,
          reason: `Confirmação do Pedido ${targetOrder.orderNumber} (${newStatus}) — Baixa física de ${qtyTotal} un`,
          operator: `${operatorName} (${operatorRole})`,
          date: new Date().toISOString(),
        });

        return {
          ...prod,
          physicalStock: currentStock,
          reservedStock: currentReserved,
        };
      }

      // 2. PENDENTE -> CANCELADO / DEVOLUCAO: apenas libera reserva e devolve variação (sem alterar físico)
      if (oldStatus === "PENDENTE" && isRefundStatus(newStatus)) {
        const currentReserved = Math.max(0, previousReserved - qtyTotal);
        newMovements.push({
          id: `mov-rel-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: "DEVOLUCAO",
          quantity: qtyTotal,
          previousStock,
          currentStock: previousStock,
          reason: `Cancelamento do Pedido Pendente ${targetOrder.orderNumber} — Reserva liberada (${qtyTotal} un)`,
          operator: `${operatorName} (${operatorRole})`,
          date: new Date().toISOString(),
        });

        const updatedVariations = prod.variations?.map((v) => {
          const retQty = matchVariationItem(v, matchingItems);
          return retQty > 0 ? { ...v, stock: v.stock + retQty } : v;
        });

        return {
          ...prod,
          reservedStock: currentReserved,
          variations: updatedVariations || prod.variations,
        };
      }

      // 3. Ativo -> CANCELADO / DEVOLUCAO: estorna estoque físico e variação
      if (isActiveSaleStatus(oldStatus) && isRefundStatus(newStatus)) {
        const currentStock = previousStock + qtyTotal;
        newMovements.push({
          id: `mov-ret-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: "DEVOLUCAO",
          quantity: qtyTotal,
          previousStock,
          currentStock,
          reason:
            newStatus === "DEVOLUCAO"
              ? `Devolução do Pedido ${targetOrder.orderNumber} — Estoque devolvido (+${qtyTotal} un)`
              : `Cancelamento do Pedido ${targetOrder.orderNumber} — Estoque devolvido (+${qtyTotal} un)`,
          operator: `${operatorName} (${operatorRole})`,
          date: new Date().toISOString(),
        });

        const updatedVariations = prod.variations?.map((v) => {
          const retQty = matchVariationItem(v, matchingItems);
          return retQty > 0 ? { ...v, stock: v.stock + retQty } : v;
        });

        return {
          ...prod,
          physicalStock: currentStock,
          variations: updatedVariations || prod.variations,
        };
      }

      // 4. CANCELADO / DEVOLUCAO -> Ativo: baixa física e variação novamente
      if (isRefundStatus(oldStatus) && isActiveSaleStatus(newStatus)) {
        const currentStock = Math.max(0, previousStock - qtyTotal);
        newMovements.push({
          id: `mov-react-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: "SAIDA",
          quantity: -qtyTotal,
          previousStock,
          currentStock,
          reason: `Reativação do Pedido ${targetOrder.orderNumber} (${newStatus}) — Baixa de estoque`,
          operator: `${operatorName} (${operatorRole})`,
          date: new Date().toISOString(),
        });

        const updatedVariations = prod.variations?.map((v) => {
          const dedQty = matchVariationItem(v, matchingItems);
          return dedQty > 0 ? { ...v, stock: Math.max(0, v.stock - dedQty) } : v;
        });

        return {
          ...prod,
          physicalStock: currentStock,
          variations: updatedVariations || prod.variations,
        };
      }

      // 5. CANCELADO / DEVOLUCAO -> PENDENTE: reserva novamente
      if (isRefundStatus(oldStatus) && newStatus === "PENDENTE") {
        const currentReserved = previousReserved + qtyTotal;
        newMovements.push({
          id: `mov-res-${Date.now()}-${prod.id}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          type: "RESERVA",
          quantity: qtyTotal,
          previousStock,
          currentStock: previousStock,
          reason: `Reabertura como Pendente do Pedido ${targetOrder.orderNumber} — Reserva de ${qtyTotal} un`,
          operator: `${operatorName} (${operatorRole})`,
          date: new Date().toISOString(),
        });

        const updatedVariations = prod.variations?.map((v) => {
          const resQty = matchVariationItem(v, matchingItems);
          return resQty > 0 ? { ...v, stock: Math.max(0, v.stock - resQty) } : v;
        });

        return {
          ...prod,
          reservedStock: currentReserved,
          variations: updatedVariations || prod.variations,
        };
      }

      return prod;
    });

    const baseOrders = orders.length > 0 ? orders : ordersRef.current;
    const nextOrders = baseOrders.map((o) =>
      o.id === targetOrder.id || o.orderNumber === targetOrder.orderNumber
        ? { ...o, status: newStatus }
        : o
    );

    const baseMovements = movements.length > 0 ? movements : movementsRef.current;
    const nextMovements =
      newMovements.length > 0 ? [...newMovements, ...baseMovements] : baseMovements;

    productsRef.current = nextProducts;
    ordersRef.current = nextOrders;
    movementsRef.current = nextMovements;

    setProducts(nextProducts);
    setMovements(nextMovements);
    setOrders(nextOrders);

    persistSnapshot({
      products: nextProducts,
      movements: nextMovements,
      orders: nextOrders,
    });
  };

  // 3. Criação de pedido real a partir da Loja Virtual (Storefront Checkout) com baixa imediata no estoque e faturamento
  const createStorefrontOrder = (orderData: StorefrontOrderData): Order => {
    const orderCart = orderData.items && orderData.items.length > 0 ? orderData.items : cart;

    if (orderCart.length === 0) {
      throw new Error("Não é possível criar um pedido com a sacola vazia.");
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BM-2026-${randomNum}`;
    const orderId = `ord-${Date.now()}`;

    // Mapear itens para OrderItem[]
    const orderItems: OrderItem[] = orderCart.map((item) => {
      const price = item.product.promoPrice || item.product.salePrice;
      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.selectedVariation?.sku || item.product.sku,
        variationName: item.selectedVariation?.name,
        quantity: item.quantity,
        price,
      };
    });

    // Calcular subtotal e total com frete e desconto
    const subtotal = orderCart.reduce((sum, item) => {
      const p = item.product.promoPrice || item.product.salePrice;
      return sum + p * item.quantity;
    }, 0);
    const totalAmount = Math.max(0, subtotal - (orderData.discountAmount || 0) + (orderData.shippingAmount || 0));

    // Pagamentos via PIX ou Cartão na Loja Virtual já confirmam como PAGO para baixar estoque e contabilizar no DRE
    const isDirectPaidCheckout = orderData.paymentMethod === "PIX" || orderData.paymentMethod === "CARTAO";
    const initialStatus: OrderStatus = isDirectPaidCheckout ? "PAGO" : "PENDENTE";

    let paymentMethodLabel = "PIX Instantâneo (QR Code / Copia e Cola)";
    if (orderData.paymentMethod === "CARTAO") {
      paymentMethodLabel = "Cartão de Crédito (Loja Virtual)";
    } else if (orderData.paymentMethod === "WHATSAPP") {
      paymentMethodLabel = "Negociação Direta via WhatsApp VIP";
    }

    let sessionAttribution: Order['attribution'] = undefined;
    if (typeof window !== 'undefined') {
      const source = sessionStorage.getItem('bm_session_source');
      if (source) {
        sessionAttribution = {
          source,
          medium: sessionStorage.getItem('bm_session_medium') || undefined,
          campaign: sessionStorage.getItem('bm_session_campaign') || undefined,
          link_code: sessionStorage.getItem('bm_session_link_code') || undefined,
        };
      }
    }

    const customerShipping = Math.round((orderData.shippingAmount || 0) * 100) / 100;
    const totalUnits = orderItems.reduce((sum, it) => sum + it.quantity, 0);
    const resolvedCompanyShippingCost =
      typeof orderData.companyShippingCost === "number" && orderData.companyShippingCost > 0
        ? Math.round(orderData.companyShippingCost * 100) / 100
        : customerShipping > 0
          ? customerShipping
          : Math.round((14.9 + Math.max(0, totalUnits - 1) * 1.5) * 100) / 100;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      channel: orderData.channel || "SITE",
      customerName: orderData.customerName.trim(),
      customerEmail: (orderData.customerEmail || "cliente@biamake.com.br").trim(),
      customerPhone: orderData.customerPhone.trim(),
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      shippingAmount: customerShipping,
      companyShippingCost: resolvedCompanyShippingCost,
      shippingCarrier:
        orderData.shippingCarrier ||
        (orderData.channel === "WHATSAPP"
          ? "Jadlog Package / Correios PAC (A Combinar)"
          : "Correios PAC"),
      shippingServiceDays: orderData.shippingServiceDays,
      shippingCep: orderData.shippingCep,
      isFreeShippingSubsidized:
        typeof orderData.isFreeShippingSubsidized === "boolean"
          ? orderData.isFreeShippingSubsidized
          : customerShipping === 0,
      status: initialStatus,
      paymentMethod: paymentMethodLabel,
      shippingAddress: orderData.shippingAddress.trim(),
      createdAt: new Date().toISOString(),
      attribution: sessionAttribution,
    };

    const newMovements: StockMovement[] = [];

    // Atualizar physicalStock (para vendas PAGAS) ou reservedStock (para vendas PENDENTES via WhatsApp) + saldo das variações
    const nextProducts = productsRef.current.map((prod) => {
      const matchingItems = orderCart.filter((ci) => ci.product.id === prod.id);
      if (matchingItems.length === 0) return prod;

      const totalQtyForProd = matchingItems.reduce((acc, mi) => acc + mi.quantity, 0);
      const previousStock = prod.physicalStock;
      const nextPhysical = isDirectPaidCheckout
        ? Math.max(0, previousStock - totalQtyForProd)
        : previousStock;
      const nextReserved = isDirectPaidCheckout
        ? prod.reservedStock || 0
        : (prod.reservedStock || 0) + totalQtyForProd;

      matchingItems.forEach((mi, idx) => {
        newMovements.push({
          id: `mov-${isDirectPaidCheckout ? "sale" : "res"}-${Date.now()}-${prod.id}-${idx}`,
          productId: prod.id,
          productName: mi.selectedVariation
            ? `${prod.name} (${mi.selectedVariation.name})`
            : prod.name,
          sku: mi.selectedVariation?.sku || prod.sku,
          type: isDirectPaidCheckout ? "SAIDA" : "RESERVA",
          quantity: isDirectPaidCheckout ? -mi.quantity : mi.quantity,
          previousStock,
          currentStock: nextPhysical,
          reason: isDirectPaidCheckout
            ? `Venda confirmada na Loja Virtual #${orderNumber} (${orderData.customerName}) — ${paymentMethodLabel}`
            : `Reserva para pedido via WhatsApp #${orderNumber} (${orderData.customerName})`,
          operator: "Loja Virtual (Checkout Online)",
          date: new Date().toISOString(),
        });
      });

      let updatedVariations = prod.variations;
      if (prod.variations && prod.variations.length > 0) {
        updatedVariations = prod.variations.map((v) => {
          const varQty = matchingItems
            .filter((mi) => mi.selectedVariation?.id === v.id)
            .reduce((sum, mi) => sum + mi.quantity, 0);
          if (varQty > 0) {
            return {
              ...v,
              stock: Math.max(0, v.stock - varQty),
            };
          }
          return v;
        });
      }

      return {
        ...prod,
        physicalStock: nextPhysical,
        reservedStock: nextReserved,
        variations: updatedVariations,
      };
    });

    const nextMovements = [...newMovements, ...movementsRef.current];
    const nextOrders = [newOrder, ...ordersRef.current];

    setProducts(nextProducts);
    setMovements(nextMovements);
    setOrders(nextOrders);

    // Persiste imediatamente em localStorage + BroadcastChannel + /api/store-state
    persistSnapshot({
      products: nextProducts,
      movements: nextMovements,
      orders: nextOrders,
    });

    // Limpar carrinho se os itens comprados foram do carrinho
    if (!orderData.items || orderData.items === cart) {
      setCart([]);
      setIsCartOpen(false);
    }

    return newOrder;
  };

  const syncChannel = (channelId: string) => {
    const nextChannels = channelsRef.current.map((c) =>
      c.id === channelId
        ? {
            ...c,
            lastSync: new Date().toISOString(),
            status: "CONECTADO" as const,
            activeAds: Math.max(c.activeAds, productsRef.current.length),
          }
        : c
    );
    setChannels(nextChannels);
    persistSnapshot({ channels: nextChannels });
  };

  const syncAllChannels = () => {
    const now = new Date().toISOString();
    const nextChannels = channelsRef.current.map((c) => ({
      ...c,
      lastSync: now,
      status: "CONECTADO" as const,
      activeAds: Math.max(c.activeAds, productsRef.current.length),
    }));
    setChannels(nextChannels);
    persistSnapshot({ channels: nextChannels });
  };

  const switchAdminProfile = (user: SystemUser) => {
    setAdminUser(user);
    setIsAdminAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
  };

  const updateChannel = (updated: MarketplaceChannel) => {
    const nextChannels = channelsRef.current.map((c) => (c.id === updated.id ? updated : c));
    setChannels(nextChannels);
    persistSnapshot({ channels: nextChannels });
  };

  const setMaintenanceMode = useCallback((active: boolean, message?: string) => {
    setIsMaintenanceMode(active);
    isMaintenanceModeRef.current = active;
    if (message !== undefined) {
      setMaintenanceMessage(message);
      maintenanceMessageRef.current = message;
    }
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.MAINTENANCE_MODE, JSON.stringify(active));
        if (message !== undefined) {
          localStorage.setItem(STORAGE_KEYS.MAINTENANCE_MESSAGE, message);
        }
      } catch (e) {
        console.error("Erro ao salvar modo manutenção no localStorage:", e);
      }

      try {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("biamakes_store_sync");
          bc.postMessage({ updatedAt: Date.now(), maintenanceMode: active, maintenanceMessage: message });
          bc.close();
        }
      } catch {}

      const now = Date.now();
      lastUpdatedAtRef.current = now;
      fetch("/api/store-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updatedAt: now,
          products: productsRef.current,
          movements: movementsRef.current,
          orders: ordersRef.current,
          channels: channelsRef.current,
          maintenanceMode: active,
          maintenanceMessage: message !== undefined ? message : maintenanceMessageRef.current,
        }),
        keepalive: true,
      }).catch(() => {});
    }
  }, []);

  return (
    <BiaMakesContext.Provider
      value={{
        products,
        movements,
        orders,
        channels,
        financial,
        users,
        cart,
        isCartOpen,
        setIsCartOpen,
        isAdminAuthenticated,
        adminUser,
        crmActiveTab,
        setCrmActiveTab,
        isSpotlightOpen,
        setIsSpotlightOpen,
        uxXrayMode,
        setUxXrayMode,
        activeScopeName,
        setActiveScopeName,
        loginAdmin,
        logoutAdmin,
        switchAdminProfile,
        addUser,
        updateUser,
        deleteUser,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        addProduct,
        updateProduct,
        deleteProduct,
        importProducts,
        addMovement,
        updateProductStock,
        updateOrderStatus,
        createStorefrontOrder,
        syncChannel,
        syncAllChannels,
        updateChannel,
        isMaintenanceMode,
        maintenanceMessage,
        setMaintenanceMode,
        isSystemOffline,
      }}
    >
      {children}
    </BiaMakesContext.Provider>
  );
}

export function useBiaMakes() {
  const ctx = useContext(BiaMakesContext);
  if (!ctx) {
    throw new Error("useBiaMakes must be used within a BiaMakesProvider");
  }
  return ctx;
}
