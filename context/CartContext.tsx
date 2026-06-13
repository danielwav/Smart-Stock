"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Product {
  id: number;
  name: string;
  category: string;
  subCategory: string | null;
  stock: number;
  price: number;
  unit: string;
  description: string | null;
  isRecommended: boolean;
  isBestSeller: boolean;
  imageKey: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  comboGroup: number | null;
  isFree: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartTotal: number;
  freeProductThreshold: number;
  amountNeededForFreeProduct: number;
  freeProductProgress: number;
  freeProductUnlocked: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addToCart: (product: Product, qty?: number) => void;
  addComboToCart: (comboId: number, products: Array<{ product: Product; quantity: number }>) => void;
  removeComboGroup: (comboGroup: number) => void;
  removeItemFromCombo: (productId: number, comboGroup: number) => void;
  addItemToCombo: (product: Product, comboGroup: number) => void;
  addFreeBeverage: (product: Product) => void;
  removeFreeBeverage: () => void;
  freeBeverage: CartItem | null;
  removeFromCart: (productId: number) => void;
  deleteFromCart: (productId: number) => void;
  clearCart: () => void;
  updateQuantity: (productId: number, quantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

let nextComboGroup = Date.now();

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [freeBeverage, setFreeBeverage] = useState<CartItem | null>(null);

  const freeProductThreshold = 50.0;

  useEffect(() => {
    const savedCart = localStorage.getItem("smart_stock_cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed);
      } catch (e) {
        console.error("Error al cargar carrito:", e);
      }
    }
    const savedFree = localStorage.getItem("smart_stock_free_beverage");
    if (savedFree) {
      try {
        setFreeBeverage(JSON.parse(savedFree));
      } catch (e) {}
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("smart_stock_cart", JSON.stringify(items));
  };

  const addToCart = (product: Product, qty: number = 1) => {
    const existingIndex = cartItems.findIndex(
      (item) => item.product.id === product.id && !item.comboGroup && !item.isFree
    );
    if (existingIndex > -1) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += qty;
      saveCart(newItems);
    } else {
      saveCart([...cartItems, { product, quantity: qty, comboGroup: null, isFree: false }]);
    }
  };

  const addComboToCart = (comboId: number, products: Array<{ product: Product; quantity: number }>) => {
    const group = nextComboGroup++;
    const newItems: CartItem[] = products.map((p) => ({
      product: p.product,
      quantity: p.quantity,
      comboGroup: group,
      isFree: false,
    }));
    saveCart([...cartItems, ...newItems]);
  };

  const removeComboGroup = (comboGroup: number) => {
    const newItems = cartItems.filter((item) => item.comboGroup !== comboGroup);
    saveCart(newItems);
  };

  const removeItemFromCombo = (productId: number, comboGroup: number) => {
    const groupItems = cartItems.filter((item) => item.comboGroup === comboGroup);
    if (groupItems.length <= 1) {
      removeComboGroup(comboGroup);
      return;
    }
    const newItems = cartItems.filter(
      (item) => !(item.product.id === productId && item.comboGroup === comboGroup)
    );
    saveCart(newItems);
  };

  const addItemToCombo = (product: Product, comboGroup: number) => {
    const existing = cartItems.find(
      (item) => item.product.id === product.id && item.comboGroup === comboGroup
    );
    if (existing) {
      const newItems = cartItems.map((item) =>
        item.product.id === product.id && item.comboGroup === comboGroup
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(newItems);
    } else {
      saveCart([
        ...cartItems,
        { product, quantity: 1, comboGroup, isFree: false },
      ]);
    }
  };

  const addFreeBeverage = (product: Product) => {
    const item: CartItem = { product, quantity: 1, comboGroup: null, isFree: true };
    setFreeBeverage(item);
    localStorage.setItem("smart_stock_free_beverage", JSON.stringify(item));
  };

  const removeFreeBeverage = () => {
    setFreeBeverage(null);
    localStorage.removeItem("smart_stock_free_beverage");
  };

  const removeFromCart = (productId: number) => {
    const item = cartItems.find((i) => i.product.id === productId);
    if (item?.comboGroup) {
      removeItemFromCombo(productId, item.comboGroup);
      return;
    }
    const existingIndex = cartItems.findIndex(
      (item) => item.product.id === productId && !item.comboGroup && !item.isFree
    );
    if (existingIndex > -1) {
      const newItems = [...cartItems];
      if (newItems[existingIndex].quantity > 1) {
        newItems[existingIndex].quantity -= 1;
        saveCart(newItems);
      } else {
        newItems.splice(existingIndex, 1);
        saveCart(newItems);
      }
    }
  };

  const deleteFromCart = (productId: number) => {
    const item = cartItems.find((i) => i.product.id === productId);
    if (item?.comboGroup) {
      removeItemFromCombo(productId, item.comboGroup);
      return;
    }
    const newItems = cartItems.filter(
      (item) => !(item.product.id === productId && !item.comboGroup && !item.isFree)
    );
    saveCart(newItems);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      deleteFromCart(productId);
      return;
    }
    const newItems = cartItems.map((item) => {
      if (item.product.id === productId && !item.comboGroup && !item.isFree) {
        return { ...item, quantity };
      }
      return item;
    });
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
    setFreeBeverage(null);
    localStorage.removeItem("smart_stock_free_beverage");
  };

  const allItems: CartItem[] = freeBeverage && freeProductProgress >= 100
    ? [...cartItems, freeBeverage]
    : cartItems;

  const cartCount = allItems.reduce((acc, item) => acc + item.quantity, 0);

  const cartSubtotal = parseFloat(
    cartItems
      .filter((item) => !item.isFree)
      .reduce((acc, item) => acc + item.product.price * item.quantity, 0)
      .toFixed(2)
  );

  const cartTotal = freeBeverage && freeProductProgress >= 100
    ? cartSubtotal
    : cartSubtotal;

  const amountNeededForFreeProduct = parseFloat(
    Math.max(0, freeProductThreshold - cartSubtotal).toFixed(2)
  );
  const freeProductProgress = Math.min(100, Math.round((cartSubtotal / freeProductThreshold) * 100));
  const freeProductUnlocked = freeProductProgress >= 100;

  return (
    <CartContext.Provider
      value={{
        cartItems: allItems,
        cartCount,
        cartSubtotal,
        cartTotal,
        freeProductThreshold,
        amountNeededForFreeProduct,
        freeProductProgress,
        freeProductUnlocked,
        searchQuery,
        setSearchQuery,
        addToCart,
        addComboToCart,
        removeComboGroup,
        removeItemFromCombo,
        addItemToCombo,
        addFreeBeverage,
        removeFreeBeverage,
        freeBeverage,
        removeFromCart,
        deleteFromCart,
        clearCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
};
