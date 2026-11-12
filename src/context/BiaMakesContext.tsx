"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
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
  addToCart: (product: Product, variation?: ProductVariation) => void;
  updateCartQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  addProduct: (newProduct: Product) => void;
  updateProduct: (updated: Product) => void;
  deleteProduct: (id: string) => void;
  importProducts: (imported: Product[]) => void;
  addMovement: (newMovement: StockMovement) => void;
  updateProductStock: (productId: string, newPhysical: number) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  createStorefrontOrder: (orderData: StorefrontOrderData) => Order;
  syncChannel: (channelId: string) => void;
  syncAllChannels: () => void;
  updateChannel: (updated: MarketplaceChannel) => void;
}

const BiaMakesContext = createContext<BiaMakesContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: "biamakes_products_v2",
  MOVEMENTS: "biamakes_movements_v2",
  ORDERS: "biamakes_orders_v2",
  CHANNELS: "biamakes_channels_v2",
  USERS: "biamakes_users_v3",
  ADMIN_AUTH: "biamakes_admin_auth_v3",
  ADMIN_USER: "biamakes_admin_user_v3",
  CART: "biamakes_cart_v2",
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
    activeOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find(
          (p) => p.id === item.productId || p.sku === item.sku
        );
        // Custo cadastrado real do produto ou fallback prudencial baseado no preço
        const unitCost = prod && typeof prod.costPrice === "number" ? prod.costPrice : item.price * 0.38;
        cmv += unitCost * item.quantity;
      });
    });

    // Despesas operacionais do período (proporcionais ou base do negócio)
    const operatingExpenses = initialFinancial.operatingExpenses;

    // 4. Lucro Líquido Real sem clamp artificial em zero (permite apuração de prejuízo operacional real caso ocorra)
    const netProfit = grossRevenue - marketplaceFees - cmv - operatingExpenses;

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

  // Helper to re-read updated data from storage
  const reloadFromStorage = () => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (savedMovements) setMovements(JSON.parse(savedMovements));

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedChannels = localStorage.getItem(STORAGE_KEYS.CHANNELS);
      if (savedChannels) setChannels(JSON.parse(savedChannels));

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) setUsers(JSON.parse(savedUsers));
    } catch (e) {
      console.error("Erro ao sincronizar do localStorage", e);
    }
  };

  // Load persisted state from localStorage
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (savedMovements) setMovements(JSON.parse(savedMovements));

      const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedChannels = localStorage.getItem(STORAGE_KEYS.CHANNELS);
      if (savedChannels) setChannels(JSON.parse(savedChannels));

      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (savedUsers) {
        const parsedUsers: SystemUser[] = JSON.parse(savedUsers);
        // Ensure master admin eduardo.nunes always exists
        const hasMaster = parsedUsers.some(
          (u) => u.username.toLowerCase() === "eduardo.nunes"
        );
        if (!hasMaster) {
          setUsers([initialUsers[0], ...parsedUsers]);
        } else {
          setUsers(parsedUsers);
        }
      }

      const savedAuth = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
      if (savedAuth === "true") setIsAdminAuthenticated(true);

      const savedUser = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
      if (savedUser) setAdminUser(JSON.parse(savedUser));

      const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error("Failed to load localStorage state", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // 1. Sincronização em tempo real entre abas / janelas (evento 'storage')
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.PRODUCTS ||
        e.key === STORAGE_KEYS.MOVEMENTS ||
        e.key === STORAGE_KEYS.ORDERS ||
        e.key === STORAGE_KEYS.CHANNELS ||
        e.key === STORAGE_KEYS.USERS
      ) {
        reloadFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 2. Sincronização periódica a cada 5 minutos (300.000 ms)
  useEffect(() => {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const interval = setInterval(() => {
      reloadFromStorage();
    }, FIVE_MINUTES_MS);

    return () => clearInterval(interval);
  }, []);

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
    const matched = users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === password
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
  const addToCart = (product: Product, variation?: ProductVariation) => {
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
      return;
    }

    let addedSuccessfully = false;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedVariation?.id === currentVar?.id
      );

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty >= availableStock) {
          alert(`Você já adicionou a quantidade máxima disponível (${availableStock} un.) para o tom "${currentVar?.name || currentProd.name}".`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
        };
        addedSuccessfully = true;
        return updated;
      } else {
        addedSuccessfully = true;
        return [...prev, { product: currentProd, selectedVariation: currentVar, quantity: 1 }];
      }
    });

    if (addedSuccessfully) {
      setIsCartOpen(true);
    }
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
    setProducts((prev) => [newProduct, ...prev]);
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
    setMovements((prev) => [initMovement, ...prev]);
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const importProducts = (imported: Product[]) => {
    setProducts((prev) => [...imported, ...prev]);
  };

  const addMovement = (newMovement: StockMovement) => {
    setMovements((prev) => [newMovement, ...prev]);
  };

  const updateProductStock = (productId: string, newPhysical: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, physicalStock: newPhysical } : p
      )
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === newStatus) return;

    const isRefundStatus = (s: OrderStatus) =>
      s === "DEVOLUCAO" || s === "CANCELADO";

    const wasRefunded = isRefundStatus(targetOrder.status);
    const isNowRefunded = isRefundStatus(newStatus);

    // If transitioning from Active -> DEVOLUCAO or CANCELADO: return sold quantity to stock & log movement
    if (!wasRefunded && isNowRefunded) {
      const newMovements: StockMovement[] = [];

      setProducts((prevProducts) =>
        prevProducts.map((prod) => {
          const matchingItems = targetOrder.items.filter(
            (it) =>
              it.productId === prod.id ||
              it.sku === prod.sku ||
              prod.variations?.some((v) => v.sku === it.sku)
          );

          if (matchingItems.length === 0) return prod;

          const totalReturnedQty = matchingItems.reduce(
            (sum, it) => sum + it.quantity,
            0
          );
          const previousStock = prod.physicalStock;
          const currentStock = previousStock + totalReturnedQty;

          newMovements.push({
            id: `mov-${Date.now()}-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: "DEVOLUCAO",
            quantity: totalReturnedQty,
            previousStock,
            currentStock,
            reason:
              newStatus === "DEVOLUCAO"
                ? `Devolução do Pedido ${targetOrder.orderNumber} — Estoque devolvido (+${totalReturnedQty} un) e valor estornado`
                : `Cancelamento do Pedido ${targetOrder.orderNumber} — Estoque devolvido (+${totalReturnedQty} un) e valor estornado`,
            operator: `${adminUser.name} (${adminUser.role})`,
            date: new Date().toISOString(),
          });

          const updatedVariations = prod.variations?.map((v) => {
            const varItem = matchingItems.find(
              (it) => it.sku === v.sku || it.variationName === v.name
            );
            if (varItem) {
              return { ...v, stock: v.stock + varItem.quantity };
            }
            return v;
          });

          return {
            ...prod,
            physicalStock: currentStock,
            variations: updatedVariations || prod.variations,
          };
        })
      );

      if (newMovements.length > 0) {
        setMovements((prev) => [...newMovements, ...prev]);
      }
    } else if (wasRefunded && !isNowRefunded) {
      // If transitioning back from DEVOLUCAO/CANCELADO -> Active status: deduct stock again
      const newMovements: StockMovement[] = [];

      setProducts((prevProducts) =>
        prevProducts.map((prod) => {
          const matchingItems = targetOrder.items.filter(
            (it) =>
              it.productId === prod.id ||
              it.sku === prod.sku ||
              prod.variations?.some((v) => v.sku === it.sku)
          );

          if (matchingItems.length === 0) return prod;

          const totalDeductedQty = matchingItems.reduce(
            (sum, it) => sum + it.quantity,
            0
          );
          const previousStock = prod.physicalStock;
          const currentStock = Math.max(0, previousStock - totalDeductedQty);

          newMovements.push({
            id: `mov-${Date.now()}-${prod.id}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: "SAIDA",
            quantity: -totalDeductedQty,
            previousStock,
            currentStock,
            reason: `Reativação do Pedido ${targetOrder.orderNumber} (${newStatus}) — Baixa de estoque`,
            operator: `${adminUser.name} (${adminUser.role})`,
            date: new Date().toISOString(),
          });

          const updatedVariations = prod.variations?.map((v) => {
            const varItem = matchingItems.find(
              (it) => it.sku === v.sku || it.variationName === v.name
            );
            if (varItem) {
              return { ...v, stock: Math.max(0, v.stock - varItem.quantity) };
            }
            return v;
          });

          return {
            ...prod,
            physicalStock: currentStock,
            variations: updatedVariations || prod.variations,
          };
        })
      );

      if (newMovements.length > 0) {
        setMovements((prev) => [...newMovements, ...prev]);
      }
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // 3. Criação de pedido real a partir da Loja Virtual (Storefront Checkout) com reserva no Kardex
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

    // Determinar método de pagamento amigável
    let paymentMethodLabel = "PIX Instantâneo (QR Code / Copia e Cola)";
    if (orderData.paymentMethod === "CARTAO") {
      paymentMethodLabel = "Cartão de Crédito (Loja Virtual)";
    } else if (orderData.paymentMethod === "WHATSAPP") {
      paymentMethodLabel = "Negociação Direta via WhatsApp VIP";
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      channel: orderData.channel || "SITE",
      customerName: orderData.customerName.trim(),
      customerEmail: (orderData.customerEmail || "cliente@biamake.com.br").trim(),
      customerPhone: orderData.customerPhone.trim(),
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      shippingAmount: Math.round((orderData.shippingAmount || 0) * 100) / 100,
      status: "PENDENTE",
      paymentMethod: paymentMethodLabel,
      shippingAddress: orderData.shippingAddress.trim(),
      createdAt: new Date().toISOString(),
    };

    // Incrementar reservedStock de cada produto comprado e atualizar o saldo da variação
    setProducts((prevProducts) => {
      return prevProducts.map((prod) => {
        const matchingItems = orderCart.filter((ci) => ci.product.id === prod.id);
        if (matchingItems.length === 0) return prod;

        const totalQtyForProd = matchingItems.reduce((acc, mi) => acc + mi.quantity, 0);
        const newReserved = (prod.reservedStock || 0) + totalQtyForProd;

        let updatedVariations = prod.variations;
        if (prod.variations && prod.variations.length > 0) {
          updatedVariations = prod.variations.map((v) => {
            const varMatch = matchingItems.find((mi) => mi.selectedVariation?.id === v.id);
            if (varMatch) {
              return {
                ...v,
                stock: Math.max(0, v.stock - varMatch.quantity),
              };
            }
            return v;
          });
        }

        return {
          ...prod,
          reservedStock: newReserved,
          variations: updatedVariations,
        };
      });
    });

    // Registrar movimentação do tipo 'RESERVA' no histórico movements (Kardex)
    const newMovements: StockMovement[] = orderCart.map((item, idx) => ({
      id: `mov-res-${Date.now()}-${idx}`,
      productId: item.product.id,
      productName: item.product.name,
      sku: item.selectedVariation?.sku || item.product.sku,
      type: "RESERVA",
      quantity: item.quantity,
      previousStock: item.product.physicalStock,
      currentStock: item.product.physicalStock,
      reason: `Reserva para o pedido da loja virtual #${orderNumber} (${orderData.customerName})`,
      operator: "Loja Virtual (Storefront Checkout)",
      date: new Date().toISOString(),
    }));

    setMovements((prev) => [...newMovements, ...prev]);

    // Inserir o novo pedido no topo de orders com status 'PENDENTE'
    setOrders((prev) => [newOrder, ...prev]);

    // Limpar carrinho se os itens comprados foram do carrinho
    if (!orderData.items || orderData.items === cart) {
      setCart([]);
      setIsCartOpen(false);
    }

    return newOrder;
  };

  const syncChannel = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId
          ? {
              ...c,
              lastSync: new Date().toISOString(),
              status: "CONECTADO",
              activeAds: Math.max(c.activeAds, products.length),
            }
          : c
      )
    );
  };

  const syncAllChannels = () => {
    const now = new Date().toISOString();
    setChannels((prev) =>
      prev.map((c) => ({
        ...c,
        lastSync: now,
        status: "CONECTADO",
        activeAds: Math.max(c.activeAds, products.length),
      }))
    );
  };

  const switchAdminProfile = (user: SystemUser) => {
    setAdminUser(user);
    setIsAdminAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, "true");
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
  };

  const updateChannel = (updated: MarketplaceChannel) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

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
