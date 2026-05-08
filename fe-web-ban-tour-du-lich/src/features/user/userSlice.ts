import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LoginData } from "../../types/user";

interface UserState {
  user: LoginData | null;
  isAuthenticated: boolean;
  justLoggedOut: boolean;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  justLoggedOut: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<LoginData | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.justLoggedOut = true;
    },
    resetJustLoggedOut(state) {
      state.justLoggedOut = false;
    }
  },
});


export const {
  setUser,
  logout,
  resetJustLoggedOut
} = userSlice.actions;

export default userSlice.reducer;
