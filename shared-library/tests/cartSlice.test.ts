import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import cartReducer, {
  addToCart,
  removeFromCart,
  clearCart,
  updateQuantity,
  loadCartState,
  saveCartState,
  CART_STORAGE_KEY,
  type CartState,
} from '../src/store/cartSlice.ts';

describe('cartSlice reducer tests', () => {
  const initialEmptyState: CartState = {
    items: [],
    totalQuantity: 0,
    totalAmount: 0,
  };

  it('should initialize with an empty cart', () => {
    const state = cartReducer(undefined, { type: '@@INIT' });
    assert.deepEqual(state.items, []);
    assert.equal(state.totalQuantity, 0);
    assert.equal(state.totalAmount, 0);
  });

  it('should add a new product to empty cart', () => {
    const item = { productId: 101, name: 'Mechanical Keyboard', price: 99.99 };
    const nextState = cartReducer(initialEmptyState, addToCart(item));

    assert.equal(nextState.items.length, 1);
    assert.equal(nextState.items[0].productId, 101);
    assert.equal(nextState.items[0].name, 'Mechanical Keyboard');
    assert.equal(nextState.items[0].price, 99.99);
    assert.equal(nextState.items[0].quantity, 1);
    assert.equal(nextState.totalQuantity, 1);
    assert.equal(nextState.totalAmount, 99.99);
  });

  it('should increment quantity when adding an existing product', () => {
    const existingState: CartState = {
      items: [{ productId: 101, name: 'Mechanical Keyboard', price: 100, quantity: 1 }],
      totalQuantity: 1,
      totalAmount: 100,
    };

    const nextState = cartReducer(
      existingState,
      addToCart({ productId: 101, name: 'Mechanical Keyboard', price: 100 })
    );

    assert.equal(nextState.items.length, 1);
    assert.equal(nextState.items[0].quantity, 2);
    assert.equal(nextState.totalQuantity, 2);
    assert.equal(nextState.totalAmount, 200);
  });

  it('should add multiple distinct products', () => {
    let state = cartReducer(
      initialEmptyState,
      addToCart({ productId: 1, name: 'Item 1', price: 20 })
    );
    state = cartReducer(
      state,
      addToCart({ productId: 2, name: 'Item 2', price: 30 })
    );

    assert.equal(state.items.length, 2);
    assert.equal(state.totalQuantity, 2);
    assert.equal(state.totalAmount, 50);
  });

  it('should decrement quantity when removing an item with quantity > 1', () => {
    const state: CartState = {
      items: [{ productId: 1, name: 'Item 1', price: 25, quantity: 2 }],
      totalQuantity: 2,
      totalAmount: 50,
    };

    const nextState = cartReducer(state, removeFromCart(1));
    assert.equal(nextState.items.length, 1);
    assert.equal(nextState.items[0].quantity, 1);
    assert.equal(nextState.totalQuantity, 1);
    assert.equal(nextState.totalAmount, 25);
  });

  it('should completely remove item when its quantity reaches 0', () => {
    const state: CartState = {
      items: [{ productId: 1, name: 'Item 1', price: 25, quantity: 1 }],
      totalQuantity: 1,
      totalAmount: 25,
    };

    const nextState = cartReducer(state, removeFromCart(1));
    assert.equal(nextState.items.length, 0);
    assert.equal(nextState.totalQuantity, 0);
    assert.equal(nextState.totalAmount, 0);
  });

  it('should handle removeFromCart for non-existent product gracefully', () => {
    const state: CartState = {
      items: [{ productId: 1, name: 'Item 1', price: 25, quantity: 1 }],
      totalQuantity: 1,
      totalAmount: 25,
    };

    const nextState = cartReducer(state, removeFromCart(999));
    assert.equal(nextState.items.length, 1);
    assert.equal(nextState.totalQuantity, 1);
    assert.equal(nextState.totalAmount, 25);
  });

  it('should update quantity to a specific higher amount', () => {
    const state: CartState = {
      items: [{ productId: 1, name: 'Item 1', price: 10, quantity: 2 }],
      totalQuantity: 2,
      totalAmount: 20,
    };

    const nextState = cartReducer(
      state,
      updateQuantity({ productId: 1, quantity: 5 })
    );

    assert.equal(nextState.items[0].quantity, 5);
    assert.equal(nextState.totalQuantity, 5);
    assert.equal(nextState.totalAmount, 50);
  });

  it('should update quantity to 0 and remove the item', () => {
    const state: CartState = {
      items: [{ productId: 1, name: 'Item 1', price: 10, quantity: 3 }],
      totalQuantity: 3,
      totalAmount: 30,
    };

    const nextState = cartReducer(
      state,
      updateQuantity({ productId: 1, quantity: 0 })
    );

    assert.equal(nextState.items.length, 0);
    assert.equal(nextState.totalQuantity, 0);
    assert.equal(nextState.totalAmount, 0);
  });

  it('should clear all items and reset totals with clearCart', () => {
    const state: CartState = {
      items: [
        { productId: 1, name: 'Item 1', price: 10, quantity: 2 },
        { productId: 2, name: 'Item 2', price: 40, quantity: 1 },
      ],
      totalQuantity: 3,
      totalAmount: 60,
    };

    const nextState = cartReducer(state, clearCart());

    assert.deepEqual(nextState.items, []);
    assert.equal(nextState.totalQuantity, 0);
    assert.equal(nextState.totalAmount, 0);
  });
});

describe('cart persistence', () => {
  const memoryStorage = (initial: Record<string, string> = {}) => {
    const data = new Map(Object.entries(initial));
    return {
      getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
      setItem: (key: string, value: string) => { data.set(key, value); },
      data,
    };
  };

  it('starts empty when nothing is stored', () => {
    assert.deepEqual(loadCartState(memoryStorage()), { items: [], totalQuantity: 0, totalAmount: 0 });
  });

  it('round-trips the cart and recomputes totals', () => {
    const storage = memoryStorage();
    const state: CartState = {
      items: [
        { productId: 2, name: 'Mechanical Keyboard', price: 149.5, quantity: 2 },
        { productId: 3, name: 'Gaming Mouse', price: 89, quantity: 1 },
      ],
      totalQuantity: 999, // ignored: totals are derived from the items on load
      totalAmount: 0,
    };
    saveCartState(state, storage);
    const loaded = loadCartState(storage);
    assert.deepEqual(loaded.items, state.items);
    assert.equal(loaded.totalQuantity, 3);
    assert.equal(loaded.totalAmount, 388);
  });

  it('ignores corrupt or invalid saved data', () => {
    assert.deepEqual(loadCartState(memoryStorage({ [CART_STORAGE_KEY]: '{not json' })).items, []);
    const mixed = JSON.stringify({ items: [
      { productId: 1, name: 'ok', price: 10, quantity: 1 },
      { productId: 'x', name: 'bad id', price: 10, quantity: 1 },
      { productId: 4, name: 'zero qty', price: 10, quantity: 0 },
      { productId: 5, name: 'no price', quantity: 1 },
    ] });
    assert.deepEqual(loadCartState(memoryStorage({ [CART_STORAGE_KEY]: mixed })).items.map((i) => i.productId), [1]);
  });

  it('keeps working when storage throws', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    assert.deepEqual(loadCartState(broken).items, []);
    assert.doesNotThrow(() => saveCartState({ items: [], totalQuantity: 0, totalAmount: 0 }, broken));
  });
});
