import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios.js";
import { checkBackendReadiness } from "../api/backendReadiness.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user from cached session if available for instant UI rendering
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const cached = localStorage.getItem("user");
      if (token && cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Fallback if parsing fails
    }
    return null;
  });

  // If there's no token, or if we have both token and cached user, loading is false immediately
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem("token");
    const cached = localStorage.getItem("user");
    return Boolean(token && !cached);
  });

  const [authError, setAuthError] = useState(null);

  // Validate session on mount with proper error discrimination
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    api
      .get("/auth/me", { signal: controller.signal })
      .then((res) => {
        setUser(res.data.user);
        try {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        } catch {}
        setAuthError(null);
      })
      .catch((err) => {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          return;
        }

        // Only clear session on CONFIRMED auth failures (401 Unauthorized / 403 Forbidden)
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setAuthError("Session expired. Please sign in again.");
        } else {
          // Temporary network failure / Cold start / 5xx error:
          // Preserve token and cached session! Do NOT log the user out.
          console.warn("Backend unreachable during session validation. Preserving offline/cached session.", err);
          checkBackendReadiness();
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    try {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch {}
    setUser(res.data.user);
    setAuthError(null);
  };

  const register = async (name, email, password, role) => {
    const res = await api.post("/auth/register", { name, email, password, role });
    localStorage.setItem("token", res.data.token);
    try {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch {}
    setUser(res.data.user);
    setAuthError(null);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
