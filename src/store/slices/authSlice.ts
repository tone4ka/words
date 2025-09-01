import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AuthState,
  User,
  LoginCredentials,
  SignUpCredentials,
} from "../../types";

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  emailConfirmationSent: false,
  pendingEmail: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Login actions
    loginRequest: (state, _action: PayloadAction<LoginCredentials>) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Signup actions
    signupRequest: (state, _action: PayloadAction<SignUpCredentials>) => {
      state.loading = true;
      state.error = null;
      state.emailConfirmationSent = false;
    },
    signupSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
      state.error = null;
      state.emailConfirmationSent = false;
      state.pendingEmail = null;
    },
    signupFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.emailConfirmationSent = false;
    },

    // Email confirmation
    emailConfirmationSent: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.emailConfirmationSent = true;
      state.pendingEmail = action.payload;
      state.error = null;
    },
    resetEmailConfirmation: (state) => {
      state.emailConfirmationSent = false;
      state.pendingEmail = null;
    },

    // Logout action
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  signupRequest,
  signupSuccess,
  signupFailure,
  emailConfirmationSent,
  resetEmailConfirmation,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
