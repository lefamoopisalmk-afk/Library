import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStore.get());
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // On first load, turn a saved token back into a signed-in user.
  useEffect(() => {
    const saved = tokenStore.get();
    if (!saved) {
      setReady(true);
      return undefined;
    }
    let alive = true;
    api('/auth/me', { token: saved })
      .then((data) => {
        if (alive) setUser(data.user);
      })
      .catch(() => {
        tokenStore.clear();
        if (alive) setToken(null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (membershipId, password, staffCode) => {
    const data = await api('/auth/login', { method: 'POST', body: { membershipId, password, staffCode } });
    tokenStore.set(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Creates an account and signs the new user straight in.
  const register = useCallback(async (details) => {
    const data = await api('/auth/register', { method: 'POST', body: details });
    tokenStore.set(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Every signed-in request goes through here, so an expired session signs
  // the user out everywhere at once.
  const request = useCallback(
    async (path, options = {}) => {
      try {
        return await api(path, { ...options, token });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) logout();
        throw err;
      }
    },
    [token, logout],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      register,
      logout,
      request,
      isAdmin: user?.role === 'admin',
      canEdit: user?.role === 'admin' || user?.role === 'librarian',
    }),
    [user, token, ready, login, register, logout, request],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
