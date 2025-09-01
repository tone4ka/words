import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";

interface NavbarProps {
  onLoginClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    dispatch({ type: "auth/logoutRequest" });
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Генерируем позитивную аватарку с помощью DiceBear API
  const avatarUrl = `https://api.dicebear.com/7.x/big-smile/svg?seed=${
    user?.email || "guest"
  }&backgroundColor=ffdfbf,ffd5dc,d1c4e9,c8e6c9,fff9c4,ffb3ba&radius=50`;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <h2 className="app-title">Hi, Katusha:)</h2>
        </div>

        <div className="navbar-right">
          <div className="user-section">
            <div className="avatar-container">
              <img src={avatarUrl} alt="Avatar" className="avatar" />
            </div>

            {user ? (
              <div className="user-dropdown">
                <button className="user-name" onClick={toggleDropdown}>
                  {user.name || user.email}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={handleLogout}>
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="login-link" onClick={onLoginClick}>
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
