import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminLoginData } from "../../types/admin";

interface AdminState {
  admin: AdminLoginData | null;
  isAuthenticated: boolean;
  justLoggedOut: boolean;
}

const initialState: AdminState = {
  admin: null,
  isAuthenticated: false,
  justLoggedOut: false,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setAdmin(state, action: PayloadAction<AdminLoginData | null>) {
      state.admin = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout(state) {
      state.admin = null;
      state.isAuthenticated = false;
      state.justLoggedOut = true;
    },
    resetJustLoggedOut(state) {
      state.justLoggedOut = false;
    },
  },
});

export const { setAdmin, logout, resetJustLoggedOut } = adminSlice.actions;

export default adminSlice.reducer;
