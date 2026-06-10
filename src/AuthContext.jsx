/**
 * AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides auth state (user, favorites) and actions to the whole app.
 *
 * Since the JWT is httpOnly we can't read it from JS — we probe the
 * /api/cities/me endpoint on mount: 200 → logged in, 401 → logged out.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, citiesApi } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);   // null = unknown, false = guest
  const [favorites, setFavorites] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Probe session on mount ─────────────────────────────────────────────────
  const checkSession = useCallback(async () => {
    try {
      const res = await citiesApi.getAll();
      // If we got here, cookie is valid
      setUser(true);
      setFavorites(res.data?.cities ?? []);
    } catch (err) {
      setUser(false);
      setFavorites([]);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    await authApi.login(email, password);
    await checkSession();
  }, [checkSession]);

  const register = useCallback(async (email, password) => {
    await authApi.register(email, password);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(false);
    setFavorites([]);
  }, []);

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    setUser(false);
    setFavorites([]);
  }, []);

  const addFavorite = useCallback(async (name, latitude, longitude) => {
    await citiesApi.add(name, latitude, longitude);
    const res = await citiesApi.getAll();
    setFavorites(res.data?.cities ?? []);
  }, []);

  const removeFavorite = useCallback(async (cityId) => {
    await citiesApi.remove(cityId);
    setFavorites(prev => prev.filter(c => c.id !== cityId));
  }, []);

  const isFavorite = useCallback((name) => {
    return favorites.some(c => c.name.toLowerCase() === name.toLowerCase());
  }, [favorites]);

  const getFavoriteId = useCallback((name) => {
    return favorites.find(c => c.name.toLowerCase() === name.toLowerCase())?.id ?? null;
  }, [favorites]);

  return (
    <AuthContext.Provider value={{
      user, authLoading, favorites,
      login, register, logout, deleteAccount,
      addFavorite, removeFavorite, isFavorite, getFavoriteId,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
