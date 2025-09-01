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
  emailConfirmationSent,
  logout,
  checkSession,
  sessionExpired,
} from "../slices/authSlice";
import { resetWordsState } from "../slices/wordsSlice";
import type { LoginCredentials, SignUpCredentials } from "../../types";
import {
  saveUserToStorage,
  shouldRefreshToken,
  clearUserFromStorage,
} from "../../utils/auth";

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

    // Сохраняем с временем истечения сессии
    const expiresAt = data.session?.expires_at;
    saveUserToStorage(user, expiresAt);

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

    // Если пользователь создан, но требует подтверждение email
    if (data.user && !data.session) {
      yield put(emailConfirmationSent(email));
      return;
    }

    // Если пользователь сразу авторизован (email уже подтвержден)
    if (data.user && data.session) {
      const user = {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name || name,
        avatar_url: data.user.user_metadata?.avatar_url,
      };

      // Сохраняем с временем истечения сессии
      const expiresAt = data.session.expires_at;
      saveUserToStorage(user, expiresAt);

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
    yield put(resetWordsState()); // Очищаем состояние слов при выходе
  } catch (error: unknown) {
    console.error("Logout error:", error);
    // Force logout even if there's an error
    yield put(logout());
    yield put(resetWordsState());
  }
}

function* checkSessionSaga() {
  try {
    // Проверяем текущую сессию в Supabase
    const {
      data: { session },
      error,
    } = yield call([supabase.auth, "getSession"]);

    if (error) throw error;

    if (session?.user) {
      // Проверяем, не истёк ли токен
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;

      if (now < expiresAt) {
        // Проверяем, нужно ли обновить токен
        if (shouldRefreshToken()) {
          try {
            const { data: refreshData, error: refreshError } = yield call([
              supabase.auth,
              "refreshSession",
            ]);
            if (refreshError) throw refreshError;

            if (refreshData.session?.user) {
              const user = {
                id: refreshData.session.user.id,
                email: refreshData.session.user.email || "",
                name: refreshData.session.user.user_metadata?.name,
                avatar_url: refreshData.session.user.user_metadata?.avatar_url,
              };

              saveUserToStorage(user, refreshData.session.expires_at);
              yield put(loginSuccess(user));
              return;
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            clearUserFromStorage();
            yield put(sessionExpired());
            yield put(resetWordsState());
            return;
          }
        }

        // Сессия валидна, обновляем пользователя
        const user = {
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
        };

        saveUserToStorage(user, session.expires_at);
        yield put(loginSuccess(user));
      } else {
        // Сессия истекла
        clearUserFromStorage();
        yield put(sessionExpired());
        yield put(resetWordsState());
      }
    } else {
      // Нет активной сессии
      clearUserFromStorage();
      yield put(checkSession());
      yield put(resetWordsState());
    }
  } catch (error: unknown) {
    console.error("Session check error:", error);
    clearUserFromStorage();
    yield put(sessionExpired());
    yield put(resetWordsState());
  }
}

function* initializeAuthSaga() {
  // Проверяем сессию при инициализации приложения
  yield call(checkSessionSaga);
}

// Watcher Sagas
export function* watchAuthSagas() {
  yield takeEvery(loginRequest.type, loginSaga);
  yield takeEvery(signupRequest.type, signupSaga);
  yield takeEvery("auth/logoutRequest", logoutSaga);
  yield takeEvery("auth/checkSessionRequest", checkSessionSaga);
  yield takeEvery("auth/initializeAuth", initializeAuthSaga);
}
