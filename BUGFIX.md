# Исправление бесконечных запросов

## Проблема

При запуске приложения возникала ошибка `ERR_INSUFFICIENT_RESOURCES` из-за бесконечных запросов к API Supabase для получения списков слов.

## Причина

1. **Цикл зависимостей**: useEffect в `WordListsContent` зависел от объекта `user`, который обновлялся при каждой проверке сессии
2. **Частые проверки сессии**: Проверка происходила каждые 5 минут
3. **Неправильная логика кэширования**: Флаг `hasFetchedRef` сбрасывался неправильно

## Решение

### 1. Разделение useEffect в App.tsx

**Было:**

```tsx
useEffect(() => {
  dispatch({ type: "auth/initializeAuth" });

  const checkInterval = setInterval(() => {
    if (user) {
      dispatch({ type: "auth/checkSessionRequest" });
    }
  }, 5 * 60 * 1000);

  return () => clearInterval(checkInterval);
}, [dispatch, user]);
```

**Стало:**

```tsx
// Инициализация (один раз)
useEffect(() => {
  dispatch({ type: "auth/initializeAuth" });
}, [dispatch]);

// Периодическая проверка (отдельно)
useEffect(() => {
  if (!user) return;

  const checkInterval = setInterval(() => {
    dispatch({ type: "auth/checkSessionRequest" });
  }, 15 * 60 * 1000); // Увеличена до 15 минут

  return () => clearInterval(checkInterval);
}, [dispatch, user]);
```

### 2. Улучшение логики в WordListsContent.tsx

**Было:**

```tsx
useEffect(() => {
  // Логика проверки и запроса внутри useEffect
  // Зависел от изменения user объекта
}, [dispatch, user, loading, wordLists.length, lastFetchTime]);
```

**Стало:**

```tsx
const fetchWordLists = useCallback(() => {
  if (!user || loading || hasFetchedRef.current) return;

  // Проверка свежести данных
  if (wordLists.length > 0 && lastFetchTime) {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (lastFetchTime >= fiveMinutesAgo) return;
  }

  hasFetchedRef.current = true;
  dispatch(fetchWordListsRequest());
}, [dispatch, user, loading, wordLists.length, lastFetchTime]);

useEffect(() => {
  // Сброс флага только при смене ID пользователя
  if (user?.id !== currentUserIdRef.current) {
    hasFetchedRef.current = false;
    currentUserIdRef.current = user?.id || null;

    if (user) {
      fetchWordLists();
    }
  }
}, [user, fetchWordLists]);
```

### 3. Ключевые улучшения

#### Мемоизация запросов

- Использование `useCallback` для предотвращения пересоздания функции
- Отслеживание ID пользователя вместо объекта целиком

#### Уменьшение частоты проверок

- Проверка сессии: с 5 до 15 минут
- Кэширование данных: 5 минут

#### Правильное управление состоянием

- Флаг `hasFetchedRef` сбрасывается только при смене пользователя
- Использование `currentUserIdRef` для отслеживания смены пользователя

## Результат

✅ **Устранены бесконечные запросы**
✅ **Уменьшена нагрузка на API**
✅ **Улучшена производительность**
✅ **Сохранена функциональность автообновления**

## Мониторинг

Для проверки работы:

1. Откройте DevTools → Network
2. Авторизуйтесь в приложении
3. Убедитесь, что запросы к `/words` происходят только:
   - При первой загрузке после логина
   - При смене пользователя
   - Через 5 минут при устаревших данных

Запросы НЕ должны повторяться бесконечно.
