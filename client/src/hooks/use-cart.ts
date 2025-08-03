import { useState, useEffect } from "react";
import { FoodItem } from "@shared/schema";
import { 
  getCart, 
  addToCart as addToCartUtil, 
  removeFromCart as removeFromCartUtil,
  updateCartItemQuantity as updateCartItemQuantityUtil,
  clearCart as clearCartUtil,
  getCartTotal,
  getCartItemCount,
  CartStore 
} from "@/lib/cart";

export const useCart = () => {
  const [cart, setCart] = useState<CartStore>(() => getCart());

  // Listen for storage changes (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = () => {
      setCart(getCart());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const addToCart = (foodItem: FoodItem, restaurantId: number, restaurantName: string, quantity: number = 1) => {
    const updatedCart = addToCartUtil(foodItem, restaurantId, restaurantName, quantity);
    setCart(updatedCart);
    return updatedCart;
  };

  const removeFromCart = (foodItemId: number) => {
    const updatedCart = removeFromCartUtil(foodItemId);
    setCart(updatedCart);
    return updatedCart;
  };

  const updateCartItemQuantity = (foodItemId: number, quantity: number) => {
    const updatedCart = updateCartItemQuantityUtil(foodItemId, quantity);
    setCart(updatedCart);
    return updatedCart;
  };

  const clearCart = () => {
    const updatedCart = clearCartUtil();
    setCart(updatedCart);
    return updatedCart;
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    total: getCartTotal(cart),
    itemCount: getCartItemCount(cart)
  };
};