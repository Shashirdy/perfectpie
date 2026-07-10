import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  activeOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    fetchOrdersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (state, action) => {
      state.loading = false;
      state.orders = action.payload;
    },
    fetchOrdersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setActiveOrder: (state, action) => {
      state.activeOrder = action.payload;
    },
    updateActiveOrderStatus: (state, action) => {
      const { status, statusLogs } = action.payload;
      if (state.activeOrder) {
        state.activeOrder.status = status;
        state.activeOrder.statusLogs = statusLogs;
      }
      // Update in local history list as well
      const order = state.orders.find((o) => o._id === state.activeOrder?._id);
      if (order) {
        order.status = status;
        order.statusLogs = statusLogs;
      }
    },
    addOrderToList: (state, action) => {
      state.orders.unshift(action.payload);
    },
  },
});

export const {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  setActiveOrder,
  updateActiveOrderStatus,
  addOrderToList,
} = orderSlice.actions;

export default orderSlice.reducer;
