# React + TypeScript + Vite + Redux Saga + Supabase Template

Современный темплейт веб-приложения с использованием передовых технологий.

🔗 **Репозиторий:** https://github.com/tone4ka/words.git

## 🚀 Технологии

- **React 18** - Библиотека для создания пользовательских интерфейсов
- **TypeScript** - Типизированный JavaScript
- **Vite** - Быстрый инструмент сборки
- **Redux Toolkit** - Управление состоянием
- **Redux Saga** - Управление побочными эффектами
- **Supabase** - Backend-as-a-Service для аутентификации и базы данных

## 📁 Структура проекта

```
src/
├── components/          # React компоненты
│   └── AuthForm.tsx    # Форма аутентификации
├── services/           # Внешние сервисы
│   └── supabase.ts    # Конфигурация Supabase
├── store/             # Redux store
│   ├── slices/        # Redux slices
│   │   └── authSlice.ts
│   ├── sagas/         # Redux sagas
│   │   ├── authSaga.ts
│   │   └── index.ts
│   ├── hooks.ts       # Типизированные Redux хуки
│   └── index.ts       # Конфигурация store
├── types/             # TypeScript типы
│   └── index.ts
├── App.tsx           # Главный компонент
└── main.tsx         # Точка входа
```

## 🛠 Установка и запуск

1. **Установите зависимости:**

   ```bash
   npm install
   ```

2. **Настройте переменные окружения:**

   ```bash
   cp .env.example .env
   ```

   Заполните в `.env` файле:

   - `VITE_SUPABASE_URL` - URL вашего проекта Supabase
   - `VITE_SUPABASE_ANON_KEY` - Анонимный ключ Supabase

3. **Запустите приложение:**
   ```bash
   npm run dev
   ```

## 🔧 Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. В настройках проекта найдите:
   - Project URL
   - Project API keys → anon public
3. Добавьте их в `.env` файл

## 📦 Основные команды

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшна
npm run preview      # Просмотр собранного приложения
npm run lint         # Проверка кода линтером
```

## 🏗 Архитектура

### Redux Store

Приложение использует Redux Toolkit для управления состоянием:

- **authSlice**: Управление аутентификацией пользователей
- **authSaga**: Обработка асинхронных операций аутентификации

### Компоненты

- **AuthForm**: Универсальная форма входа/регистрации
- Поддержка типизированных Redux хуков

### Типизация

Все компоненты полностью типизированы с помощью TypeScript.

## 🔒 Безопасность

- Переменные окружения для конфиденциальных данных
- Row Level Security (RLS) в Supabase
- Типизированные API вызовы

## 🎨 Стилизация

Приложение использует современный CSS с:

- CSS переменными
- Backdrop-filter эффектами
- Адаптивным дизайном
- Темной/светлой темами

## 📝 Лицензия

MIT
