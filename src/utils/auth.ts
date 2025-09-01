import type { User } from "../types";

// Константы для localStorage
export const AUTH_STORAGE_KEYS = {
  USER: "auth_user",
  TIMESTAMP: "auth_timestamp",
  EXPIRES_AT: "auth_expires_at",
} as const;

// Максимальное время жизни сессии (24 часа)
export const MAX_SESSION_AGE = 24 * 60 * 60 * 1000;

/**
 * Сохраняет пользователя в localStorage с временной меткой
 */
export const saveUserToStorage = (user: User, expiresAt?: number) => {
  try {
    const timestamp = Date.now();
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(AUTH_STORAGE_KEYS.TIMESTAMP, timestamp.toString());

    if (expiresAt) {
      localStorage.setItem(AUTH_STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
    }
  } catch (error) {
    console.error("Error saving user to localStorage:", error);
  }
};

/**
 * Загружает пользователя из localStorage с проверкой времени
 */
export const loadUserFromStorage = (): User | null => {
  try {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    const timestamp = localStorage.getItem(AUTH_STORAGE_KEYS.TIMESTAMP);
    const expiresAt = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT);

    if (!userStr || !timestamp) return null;

    const now = Date.now();
    const sessionAge = now - parseInt(timestamp);

    // Проверяем максимальное время жизни сессии
    if (sessionAge > MAX_SESSION_AGE) {
      clearUserFromStorage();
      return null;
    }

    // Проверяем время истечения токена, если оно есть
    if (expiresAt) {
      const expirationTime = parseInt(expiresAt) * 1000; // Конвертируем в миллисекунды
      if (now >= expirationTime) {
        clearUserFromStorage();
        return null;
      }
    }

    return JSON.parse(userStr);
  } catch (error) {
    console.error("Error loading user from localStorage:", error);
    clearUserFromStorage();
    return null;
  }
};

/**
 * Очищает все данные авторизации из localStorage
 */
export const clearUserFromStorage = () => {
  try {
    Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Error clearing user from localStorage:", error);
  }
};

/**
 * Проверяет, нужно ли обновить токен (если осталось меньше 5 минут)
 */
export const shouldRefreshToken = (): boolean => {
  try {
    const expiresAt = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT);
    if (!expiresAt) return false;

    const now = Math.floor(Date.now() / 1000);
    const expiration = parseInt(expiresAt);
    const timeLeft = expiration - now;

    // Обновляем токен, если осталось меньше 5 минут (300 секунд)
    return timeLeft < 300;
  } catch (error) {
    console.error("Error checking token refresh:", error);
    return false;
  }
};

/**
 * Получает время истечения токена в секундах
 */
export const getTokenExpirationTime = (): number | null => {
  try {
    const expiresAt = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT);
    return expiresAt ? parseInt(expiresAt) : null;
  } catch (error) {
    console.error("Error getting token expiration:", error);
    return null;
  }
};
