import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer, { saveCartState } from './cartSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
});

// Persist the cart on every change (the reducer loads it back on start-up).
let savedCart = store.getState().cart;
store.subscribe(() => {
  const cart = store.getState().cart;
  if (cart !== savedCart) {
    savedCart = cart;
    saveCartState(cart);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
