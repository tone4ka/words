import { call, put, takeEvery } from "redux-saga/effects";
import type { PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "../../services/supabase";
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  signupRequest,
  signupSuccess,
  signupFailure,
  logout,
} from "../slices/authSlice";
import type { LoginCredentials, SignUpCredentials } from "../../types";

// Worker Sagas
function* loginSaga(action: PayloadAction<LoginCredentials>) {
  try {
    const { email, password } = action.payload;
    const { data, error } = yield call([supabase.auth, "signInWithPassword"], {
      email,
      password,
    });

    if (error) throw error;

    const user = {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.user_metadata?.name,
      avatar_url: data.user.user_metadata?.avatar_url,
    };

    yield put(loginSuccess(user));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    yield put(loginFailure(message));
  }
}

function* signupSaga(action: PayloadAction<SignUpCredentials>) {
  try {
    const { email, password, name } = action.payload;
    const { data, error } = yield call([supabase.auth, "signUp"], {
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const user = {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name || name,
        avatar_url: data.user.user_metadata?.avatar_url,
      };

      yield put(signupSuccess(user));
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Signup failed";
    yield put(signupFailure(message));
  }
}

function* logoutSaga() {
  try {
    yield call([supabase.auth, "signOut"]);
    yield put(logout());
  } catch (error: unknown) {
    console.error("Logout error:", error);
    // Force logout even if there's an error
    yield put(logout());
  }
}

// Watcher Sagas
export function* watchAuthSagas() {
  yield takeEvery(loginRequest.type, loginSaga);
  yield takeEvery(signupRequest.type, signupSaga);
  yield takeEvery("auth/logoutRequest", logoutSaga);
}
