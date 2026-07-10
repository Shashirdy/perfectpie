import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  savedForLater: [],
  appliedCoupon: null,
  subtotal: 0,
  discount: 0,
  total: 0,
};

// Helper function to calculate totals
const calculateTotals = (state) => {
  state.subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (state.appliedCoupon) {
    const { discountType, discountValue, minOrderValue } = state.appliedCoupon;
    if (state.subtotal >= minOrderValue) {
      if (discountType === 'percentage') {
        state.discount = state.subtotal * (discountValue / 100);
      } else {
        state.discount = discountValue;
      }
      // Cap discount
      if (state.discount > state.subtotal) {
        state.discount = state.subtotal;
      }
    } else {
      // Coupon no longer valid due to subtotal dropping
      state.appliedCoupon = null;
      state.discount = 0;
    }
  } else {
    state.discount = 0;
  }

  state.subtotal = parseFloat(state.subtotal.toFixed(2));
  state.discount = parseFloat(state.discount.toFixed(2));
  state.total = parseFloat((state.subtotal - state.discount).toFixed(2));
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      // Create a unique key for custom configurations to check for duplicates
      const pizza = action.payload;
      const uniqueKey = `${pizza.name || 'Custom'}-${pizza.base}-${pizza.sauce}-${pizza.cheese}-${pizza.veggies.sort().join(',')}`;

      const existingIndex = state.items.findIndex((item) => {
        const itemKey = `${item.name || 'Custom'}-${item.base}-${item.sauce}-${item.cheese}-${item.veggies.sort().join(',')}`;
        return itemKey === uniqueKey;
      });

      if (existingIndex !== -1) {
        state.items[existingIndex].quantity += pizza.quantity || 1;
      } else {
        state.items.push({
          ...pizza,
          uniqueId: uniqueKey + '-' + Date.now(),
          quantity: pizza.quantity || 1,
        });
      }
      calculateTotals(state);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.uniqueId !== action.payload);
      calculateTotals(state);
    },
    updateQuantity: (state, action) => {
      const { uniqueId, quantity } = action.payload;
      const item = state.items.find((item) => item.uniqueId === uniqueId);
      if (item && quantity > 0) {
        item.quantity = quantity;
      }
      calculateTotals(state);
    },
    saveForLater: (state, action) => {
      const uniqueId = action.payload;
      const item = state.items.find((i) => i.uniqueId === uniqueId);
      if (item) {
        state.savedForLater.push(item);
        state.items = state.items.filter((i) => i.uniqueId !== uniqueId);
      }
      calculateTotals(state);
    },
    moveToCart: (state, action) => {
      const uniqueId = action.payload;
      const item = state.savedForLater.find((i) => i.uniqueId === uniqueId);
      if (item) {
        state.items.push(item);
        state.savedForLater = state.savedForLater.filter((i) => i.uniqueId !== uniqueId);
      }
      calculateTotals(state);
    },
    removeFromSaved: (state, action) => {
      state.savedForLater = state.savedForLater.filter((item) => item.uniqueId !== action.payload);
    },
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
      calculateTotals(state);
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.discount = 0;
      calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.subtotal = 0;
      state.discount = 0;
      state.total = 0;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  saveForLater,
  moveToCart,
  removeFromSaved,
  applyCoupon,
  removeCoupon,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
