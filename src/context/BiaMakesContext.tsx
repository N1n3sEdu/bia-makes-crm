"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  Product,
  ProductVariation,
  StockMovement,
  Order,
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
  loginAdmin: (username: string, password: string) => { success: boolean; message?: string };
  logoutAdmin: () => void;
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
  syncChannel: (channelId: string) => void;
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

  // Dynamically compute financial metrics removing DEVOLUCAO and CANCELADO orders automatically
  const financial: FinancialMetric = useMemo(() => {
    const refundedOrders = orders.filter(
      (o) => o.status === "DEVOLUCAO" || o.status === "CANCELADO"
    );
    const refundedAmount = refundedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const refundedOrdersCount = refundedOrders.length;

    // Calculate CMV and fees of refunded orders to deduct accurately
    let refundedCmv = 0;
    refundedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const prod = products.find(
          (p) => p.id === item.productId || p.sku === item.sku
        );
        const unitCost = prod ? prod.costPrice : item.price * 0.38;
        refundedCmv += unitCost * item.quantity;
      });
    });

    const refundedFees = refundedAmount * 0.14;
    const grossRevenue = Math.max(0, initialFinancial.grossRevenue - refundedAmount);
    const marketplaceFees = Math.max(0, initialFinancial.marketplaceFees - refundedFees);
    const cmv = Math.max(0, initialFinancial.cmv - refundedCmv);
    const operatingExpenses = initialFinancial.operatingExpenses;
    const netProfit = Math.max(
      0,
      grossRevenue - marketplaceFees - cmv - operatingExpenses
    );
    const ordersCount = Math.max(0, initialFinancial.ordersCount - refundedOrdersCount);
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
  }, [orders, products]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<SystemUser>(defaultAdminUser);
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

  // Cart Actions
  const addToCart = (product: Product, variation?: ProductVariation) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedVariation?.id === variation?.id
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        return [...prev, { product, selectedVariation: variation, quantity: 1 }];
      }
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
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
        loginAdmin,
        logoutAdmin,
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
        syncChannel,
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
