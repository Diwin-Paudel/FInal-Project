import { FoodItem } from "@shared/schema";

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
  restaurantId: number;
  restaurantName: string;
}

export interface CartStore {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
}

// Cart management
const CART_STORAGE_KEY = "food-delivery-cart";

export const getCart = (): CartStore => {
  if (typeof window === "undefined") {
    return { items: [], restaurantId: null, restaurantName: null };
  }
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) {
      return { items: [], restaurantId: null, restaurantName: null };
    }
    return JSON.parse(stored);
  } catch {
    return { items: [], restaurantId: null, restaurantName: null };
  }
};

export const saveCart = (cart: CartStore): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }
};

export const addToCart = (
  foodItem: FoodItem,
  restaurantId: number,
  restaurantName: string,
  quantity: number = 1
): CartStore => {
  const cart = getCart();
  
  // If cart is from different restaurant, clear it
  if (cart.restaurantId && cart.restaurantId !== restaurantId) {
    cart.items = [];
  }
  
  cart.restaurantId = restaurantId;
  cart.restaurantName = restaurantName;
  
  // Check if item already exists
  const existingItemIndex = cart.items.findIndex(
    item => item.foodItem.id === foodItem.id
  );
  
  if (existingItemIndex >= 0) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    cart.items.push({
      foodItem,
      quantity,
      restaurantId,
      restaurantName
    });
  }
  
  saveCart(cart);
  return cart;
};

export const removeFromCart = (foodItemId: number): CartStore => {
  const cart = getCart();
  cart.items = cart.items.filter(item => item.foodItem.id !== foodItemId);
  
  if (cart.items.length === 0) {
    cart.restaurantId = null;
    cart.restaurantName = null;
  }
  
  saveCart(cart);
  return cart;
};

export const updateCartItemQuantity = (foodItemId: number, quantity: number): CartStore => {
  const cart = getCart();
  const itemIndex = cart.items.findIndex(item => item.foodItem.id === foodItemId);
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  }
  
  if (cart.items.length === 0) {
    cart.restaurantId = null;
    cart.restaurantName = null;
  }
  
  saveCart(cart);
  return cart;
};

export const clearCart = (): CartStore => {
  const cart: CartStore = { items: [], restaurantId: null, restaurantName: null };
  saveCart(cart);
  return cart;
};

export const getCartTotal = (cart: CartStore): number => {
  return cart.items.reduce((total, item) => {
    return total + (item.foodItem.price * item.quantity);
  }, 0);
};

export const getCartItemCount = (cart: CartStore): number => {
  return cart.items.reduce((total, item) => total + item.quantity, 0);
};