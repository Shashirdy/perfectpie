import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bases: [],
  sauces: [],
  cheeses: [],
  veggies: [],
  allItems: [], // Consolidated list
  lowStockItems: [],
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    fetchInventoryStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchInventorySuccess: (state, action) => {
      state.loading = false;
      const items = action.payload;
      state.allItems = items;

      // Group items by type
      state.bases = items.filter((item) => item.type === 'base');
      state.sauces = items.filter((item) => item.type === 'sauce');
      state.cheeses = items.filter((item) => item.type === 'cheese');
      state.veggies = items.filter((item) => item.type === 'veggie');

      // Filter low stock items
      state.lowStockItems = items.filter((item) => item.stock <= item.threshold);
    },
    fetchInventoryFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateStockCount: (state, action) => {
      const { id, stock } = action.payload;
      const item = state.allItems.find((i) => i._id === id);
      if (item) {
        item.stock = stock;
        // Re-evaluate groupings
        state.bases = state.allItems.filter((i) => i.type === 'base');
        state.sauces = state.allItems.filter((i) => i.type === 'sauce');
        state.cheeses = state.allItems.filter((i) => i.type === 'cheese');
        state.veggies = state.allItems.filter((i) => i.type === 'veggie');
        state.lowStockItems = state.allItems.filter((i) => i.stock <= i.threshold);
      }
    },
  },
});

export const { fetchInventoryStart, fetchInventorySuccess, fetchInventoryFailure, updateStockCount } = inventorySlice.actions;
export default inventorySlice.reducer;
