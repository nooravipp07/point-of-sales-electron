import { createSlice } from '@reduxjs/toolkit';
import { mround } from '../../utils/formatNumber';

const initialState = {
  items: [],
  paymentMethod: '',
  customer: '',
  branch: '',
  butcher: '',
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existing = state.items.find(item => item.id === product.id);
      
      if (existing) {
        existing.quantity += product.unit === 'kg' ? 0.5 : 1;
      } else {
        state.items.push({
          ...product,
          quantity: product.unit === 'kg' ? 0.5 : 1,
        });
      }
    },

    updateQuantity: (state, action) => {
      const { id, delta } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.quantity = Math.max(0.1, item.quantity + delta);
      }
    },

    setQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const numValue = parseFloat(quantity);
      if (isNaN(numValue)) return;
      
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.quantity = Math.max(0, numValue);
      }
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },

    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },

    setCustomer: (state, action) => {
      state.customer = action.payload;
    },

    setBranch: (state, action) => {
      state.branch = action.payload;
    },

    setButcher: (state, action) => {
      state.butcher = action.payload;
    },

    clearCart: (state) => {
      state.items = [];
      state.paymentMethod = '';
      state.customer = '';
      state.branch = '';
      state.butcher = '';
    },

    setCartData: (state, action) => {
      const { customer, branch, butcher } = action.payload;
      if (customer !== undefined) state.customer = customer;
      if (branch !== undefined) state.branch = branch;
      if (butcher !== undefined) state.butcher = butcher;
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  setQuantity,
  removeFromCart,
  setPaymentMethod,
  setCustomer,
  setBranch,
  setButcher,
  clearCart,
  setCartData,
} = cartSlice.actions;

export default cartSlice.reducer;
