"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartTotal: number;
  freeProductThreshold: number;
  amountNeededForFreeProduct: number;
  freeProductProgress: number; // 0 to 100
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  deleteFromCart: (productId: number) => void;
  clearCart: () => void;
  updateQuantity: (productId: number, quantity: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const freeProductThreshold = 50.0; // S/ 50.00 para producto gratis

  // Cargar carrito del localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("smart_stock_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error al cargar carrito:", e);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("smart_stock_cart", JSON.stringify(items));
  };

  const addToCart = (product: Product, qty: number = 1) => {
    const existingIndex = cartItems.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += qty;
      saveCart(newItems);
    } else {
      saveCart([...cartItems, { product, quantity: qty }]);
    }
  };

  const removeFromCart = (productId: number) => {
    const existingIndex = cartItems.findIndex((item) => item.product.id === productId);
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
    const newItems = cartItems.filter((item) => item.product.id !== productId);
    saveCart(newItems);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      deleteFromCart(productId);
      return;
    }
    const newItems = cartItems.map((item) => {
      if (item.product.id === productId) {
        return { ...item, quantity };
      }
      return item;
    });
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // Cálculos reactivos
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = parseFloat(
    cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0).toFixed(2)
  );
  const cartTotal = cartSubtotal; // Simulación: subtotal = total en moneda local S/

  const amountNeededForFreeProduct = parseFloat(
    Math.max(0, freeProductThreshold - cartSubtotal).toFixed(2)
  );
  const freeProductProgress = Math.min(100, Math.round((cartSubtotal / freeProductThreshold) * 100));

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartSubtotal,
        cartTotal,
        freeProductThreshold,
        amountNeededForFreeProduct,
        freeProductProgress,
        searchQuery,
        setSearchQuery,
        addToCart,
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
