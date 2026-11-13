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
export declare const addToCart: import("@reduxjs/toolkit").ActionCreatorWithPayload<Omit<CartItem, "quantity">, "cart/addToCart">, removeFromCart: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "cart/removeFromCart">, clearCart: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"cart/clearCart">, updateQuantity: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    productId: number;
    quantity: number;
}, "cart/updateQuantity">;
declare const _default: import("redux").Reducer<CartState>;
export default _default;
