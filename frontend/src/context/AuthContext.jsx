import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Use lazy initialization to read from localStorage immediately
  const [authenticated, setAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  });

  // Set loading to false immediately because we have our state
  const [loading, setLoading] = useState(false);

  const login = (userData) => {
    setAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ authenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};