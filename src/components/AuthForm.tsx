import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loginRequest,
  signupRequest,
  clearError,
} from "../store/slices/authSlice";
import type { LoginCredentials, SignUpCredentials } from "../types";

const AuthForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((state) => state.auth);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      const credentials: LoginCredentials = {
        email: formData.email,
        password: formData.password,
      };
      dispatch(loginRequest(credentials));
    } else {
      const credentials: SignUpCredentials = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
      };
      dispatch(signupRequest(credentials));
    }
  };

  const getButtonText = () => {
    if (loading) return "Processing...";
    return isLogin ? "Login" : "Sign Up";
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
    setFormData({ email: "", password: "", name: "" });
  };

  if (user) {
    return (
      <div className="auth-container">
        <div className="welcome-card">
          <h2>Welcome, {user.name || user.email}!</h2>
          <p>You are successfully logged in.</p>
          <button
            onClick={() => dispatch({ type: "auth/logoutRequest" })}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? "Login" : "Sign Up"}</h2>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => dispatch(clearError())}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {getButtonText()}
          </button>
        </form>

        <div className="toggle-mode">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={toggleMode} className="toggle-btn">
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
