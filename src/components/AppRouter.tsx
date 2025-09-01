import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "../store";
import { useAppSelector, useAppDispatch } from "../store/hooks";

// Pages
import HomePage from "../pages/HomePage";
import DashboardPage from "../pages/DashboardPage";
import WordListPage from "../pages/WordListPage";
import EmailConfirmPage from "../pages/EmailConfirmPage";
import CreateListPage from "../pages/CreateListPage";
import EditListPage from "../pages/EditListPage";

// Components
import Navbar from "./Navbar";
import AuthForm from "./AuthForm";
import ProtectedRoute from "./ProtectedRoute";

// Компонент для отображения модального окна логина на главной странице
const HomePageWithLogin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const showLogin = searchParams.get("login") === "true";
  const { user, emailConfirmationSent } = useAppSelector((state) => state.auth);

  const handleCloseLogin = () => {
    setSearchParams({});
  };

  // Редирект при подтверждении email
  if (emailConfirmationSent) {
    return <Navigate to="/email-confirm" replace />;
  }

  // Редирект авторизованных пользователей
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <HomePage />
      {showLogin && (
        <div className="login-modal">
          <div className="login-modal-content">
            <button className="close-modal" onClick={handleCloseLogin}>
              ×
            </button>
            <AuthForm onClose={handleCloseLogin} />
          </div>
        </div>
      )}
    </>
  );
};

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  // Инициализация проверки сессии
  useEffect(() => {
    dispatch({ type: "auth/initializeAuth" });
  }, [dispatch]);

  // Периодическая проверка сессии
  const { user } = useAppSelector((state) => state.auth);
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(() => {
      dispatch({ type: "auth/checkSessionRequest" });
    }, 15 * 60 * 1000); // 15 минут

    return () => clearInterval(checkInterval);
  }, [dispatch, user]);

  return (
    <div className="App">
      <Navbar />
      <div className="app-content">
        <main>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<HomePageWithLogin />} />
            <Route path="/email-confirm" element={<EmailConfirmPage />} />

            {/* Защищённые маршруты */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/word-list/:listName"
              element={
                <ProtectedRoute>
                  <WordListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-list"
              element={
                <ProtectedRoute>
                  <CreateListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-list/:listName"
              element={
                <ProtectedRoute>
                  <EditListPage />
                </ProtectedRoute>
              }
            />

            {/* Редирект неизвестных маршрутов */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const AppRouter: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
};

export default AppRouter;
