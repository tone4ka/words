import { useState } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store";
import { resetEmailConfirmation } from "./store/slices/authSlice";
import type { AppState } from "./types";
import AuthForm from "./components/AuthForm";
import Navbar from "./components/Navbar";
import "./App.css";

// Компонент для отображения уведомления о подтверждении email
const EmailConfirmationNotification = () => {
  const { emailConfirmationSent, pendingEmail } = useSelector(
    (state: AppState) => state.auth
  );
  const dispatch = useDispatch();

  if (!emailConfirmationSent || !pendingEmail) {
    return null;
  }

  return (
    <div className="welcome-content">
      <div className="email-confirmation-card">
        <h2>📧 Подтвердите email</h2>
        <p>Мы отправили письмо с подтверждением на адрес:</p>
        <strong>{pendingEmail}</strong>
        <p>
          Пожалуйста, проверьте вашу почту и перейдите по ссылке для
          подтверждения аккаунта.
        </p>
        <button
          onClick={() => dispatch(resetEmailConfirmation())}
          className="back-btn"
        >
          Назад к регистрации
        </button>
      </div>
    </div>
  );
};

function App() {
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  return (
    <Provider store={store}>
      <div className="App">
        <Navbar onLoginClick={handleLoginClick} />

        <div className="app-content">
          <header className="App-header">
            <h1>English Dictionary</h1>
            <p>Изучай английские слова весело!</p>
          </header>

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

            {!showLogin && (
              <>
                <EmailConfirmationNotification />
                <div className="welcome-content">
                  <div className="fun-card">
                    <h2>🌟 Добро пожаловать! 🌟</h2>
                    <p>Здесь ты можешь изучать новые английские слова!</p>
                    <div className="emoji-decoration">📚 🎮 🌈 ⭐ 🎯</div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </Provider>
  );
}

export default App;
