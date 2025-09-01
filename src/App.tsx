import { useState, useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store";
import type { AppState } from "./types";
import AuthForm from "./components/AuthForm";
import Navbar from "./components/Navbar";
import EmailConfirmationPage from "./components/EmailConfirmationPage";
import WordListsContent from "./components/WordListsContent";
import "./App.css";

function AppContent() {
  const dispatch = useDispatch();
  const [showLogin, setShowLogin] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const { emailConfirmationSent, user } = useSelector(
    (state: AppState) => state.auth
  );

  // Инициализация проверки сессии
  useEffect(() => {
    dispatch({ type: "auth/initializeAuth" });
  }, [dispatch]);

  // Периодическая проверка сессии (отдельный effect)
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(() => {
      dispatch({ type: "auth/checkSessionRequest" });
    }, 15 * 60 * 1000); // 15 минут

    return () => clearInterval(checkInterval);
  }, [dispatch, user]); // Зависим от пользователя

  // Редирект на страницу подтверждения email
  useEffect(() => {
    if (emailConfirmationSent) {
      setShowLogin(false);
      setShowEmailConfirmation(true);
    } else {
      setShowEmailConfirmation(false);
    }
  }, [emailConfirmationSent]);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleBackFromEmailConfirmation = () => {
    setShowEmailConfirmation(false);
    setShowLogin(true);
  };

  // Показываем страницу подтверждения email
  if (showEmailConfirmation) {
    return <EmailConfirmationPage onBack={handleBackFromEmailConfirmation} />;
  }

  return (
    <div className="App">
      <Navbar onLoginClick={handleLoginClick} />

      <div className="app-content">
        {!user && (
          <header className="App-header">
            <h1>English Dictionary</h1>
            <p>Изучай английские слова весело!</p>
          </header>
        )}

        <main>
          {showLogin && (
            <div className="login-modal">
              <div className="login-modal-content">
                <button
                  className="close-modal"
                  onClick={() => setShowLogin(false)}
                >
                  ×
                </button>
                <AuthForm onClose={() => setShowLogin(false)} />
              </div>
            </div>
          )}

          {!showLogin && !user && (
            <div className="welcome-content">
              <div className="fun-card">
                <h2>🌟 Добро пожаловать! 🌟</h2>
                <p>Здесь ты можешь изучать новые английские слова!</p>
                <div className="emoji-decoration">📚 🎮 🌈 ⭐ 🎯</div>
              </div>
            </div>
          )}

          {!showLogin && user && <WordListsContent />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
