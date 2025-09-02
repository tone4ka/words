import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";

const Navbar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    dispatch({ type: "auth/logoutRequest" });
    setShowDropdown(false);
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/?login=true");
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
          <Link to={user ? "/dashboard" : "/"} className="app-title-link">
            <h2 className="app-title">Hi, Katyusha:)</h2>
          </Link>
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
              <button className="login-link" onClick={handleLoginClick}>
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
