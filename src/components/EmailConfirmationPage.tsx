import React from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { resetEmailConfirmation } from "../store/slices/authSlice";

interface EmailConfirmationPageProps {
  onBack: () => void;
}

const EmailConfirmationPage: React.FC<EmailConfirmationPageProps> = ({
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const { pendingEmail } = useAppSelector((state) => state.auth);

  const handleBack = () => {
    dispatch(resetEmailConfirmation());
    onBack();
  };

  return (
    <div className="email-confirmation-page">
      <div className="email-confirmation-container">
        <div className="email-confirmation-card">
          <h1>📧 Подтвердите email</h1>
          <div className="confirmation-content">
            <p>Мы отправили письмо с подтверждением на адрес:</p>
            <strong className="email-address">{pendingEmail}</strong>
            <p>
              Пожалуйста, проверьте вашу почту и перейдите по ссылке для
              подтверждения аккаунта.
            </p>
            <div className="instructions">
              <h3>📋 Что делать дальше:</h3>
              <ol>
                <li>Откройте ваш почтовый ящик</li>
                <li>Найдите письмо от нашего сервиса</li>
                <li>Нажмите на ссылку подтверждения</li>
                <li>Вернитесь на эту страницу и войдите в аккаунт</li>
              </ol>
            </div>
            <div className="actions">
              <button onClick={handleBack} className="back-btn">
                ← Назад к регистрации
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;
