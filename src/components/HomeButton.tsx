import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

const HomeButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const handleClick = () => {
    navigate("/dashboard");
  };

  // Показываем кнопку только авторизованным пользователям и не на главной странице
  if (
    !user ||
    location.pathname === "/" ||
    location.pathname === "/dashboard"
  ) {
    return null;
  }

  return (
    <button className="home-button" onClick={handleClick} title="На главную">
      🏠
    </button>
  );
};

export default HomeButton;
