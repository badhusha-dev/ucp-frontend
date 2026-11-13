export declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    auth: import("./authSlice").AuthState;
    cart: import("./cartSlice").CartState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        auth: import("./authSlice").AuthState;
        cart: import("./cartSlice").CartState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
