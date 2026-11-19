import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
}

/** localStorage key for the shopper's cart, kept until checkout or "clear cart" empties it. */
export const CART_STORAGE_KEY = 'ucp_cart_v1';

type CartStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): CartStorage | undefined {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined;
  } catch {
    return undefined; // storage blocked (privacy mode, sandboxed iframe)
  }
}

function withTotals(items: CartItem[]): CartState {
  return {
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

/** The saved cart, or an empty one when nothing (or nothing valid) is stored. Totals are recomputed from the items. */
export function loadCartState(storage: CartStorage | undefined = browserStorage()): CartState {
  try {
    const raw = storage?.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const items: CartItem[] = (Array.isArray(parsed?.items) ? parsed.items : [])
      .filter((i: any) => Number.isFinite(i?.productId) && Number.isFinite(i?.price) && Number.isInteger(i?.quantity) && i.quantity > 0)
      .map((i: any) => ({ productId: i.productId, name: String(i.name ?? ''), price: i.price, quantity: i.quantity }));
    return withTotals(items);
  } catch {
    return withTotals([]);
  }
}

/** Saves the cart so a reload, a new tab or a closed browser does not lose it before the cart page syncs it. */
export function saveCartState(state: CartState, storage: CartStorage | undefined = browserStorage()): void {
  try {
    storage?.setItem(CART_STORAGE_KEY, JSON.stringify({ items: state.items }));
  } catch {
    // quota exceeded or storage blocked: the cart still works for this page view
  }
}

const initialState = (): CartState => loadCartState();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Omit<CartItem, 'quantity'>>) {
      const newItem = action.payload;
      const existingItem = state.items.find(item => item.productId === newItem.productId);
      state.totalQuantity++;
      state.totalAmount += newItem.price;
      
      if (!existingItem) {
        state.items.push({
          productId: newItem.productId,
          name: newItem.name,
          price: newItem.price,
          quantity: 1
        });
      } else {
        existingItem.quantity++;
      }
    },
    removeFromCart(state, action: PayloadAction<number>) {
      const id = action.payload;
      const existingItem = state.items.find(item => item.productId === id);
      if (existingItem) {
        state.totalQuantity--;
        state.totalAmount -= existingItem.price;
        if (existingItem.quantity === 1) {
          state.items = state.items.filter(item => item.productId !== id);
        } else {
          existingItem.quantity--;
        }
      }
    },
    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
    },
    updateQuantity(state, action: PayloadAction<{ productId: number; quantity: number }>) {
      const { productId, quantity } = action.payload;
      const existingItem = state.items.find(item => item.productId === productId);
      if (existingItem) {
        if (quantity <= 0) {
          state.totalQuantity -= existingItem.quantity;
          state.totalAmount -= existingItem.price * existingItem.quantity;
          state.items = state.items.filter(item => item.productId !== productId);
        } else {
          const diff = quantity - existingItem.quantity;
          existingItem.quantity = quantity;
          state.totalQuantity += diff;
          state.totalAmount += existingItem.price * diff;
        }
      }
    }
  }
});

export const { addToCart, removeFromCart, clearCart, updateQuantity } = cartSlice.actions;
export default cartSlice.reducer;
