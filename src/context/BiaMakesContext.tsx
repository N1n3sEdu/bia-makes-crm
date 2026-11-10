"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  const [financial] = useState<FinancialMetric>(initialFinancial);
  const [users, setUsers] = useState<SystemUser[]>(initialUsers);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<SystemUser>(defaultAdminUser);
  const [hydrated, setHydrated] = useState(false);

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
