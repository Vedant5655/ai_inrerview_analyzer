import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    sessionStorage.removeItem('access_token');
    setUser(null);
  };

  useEffect(() => {
    const onExpired = () => clearSession();
    window.addEventListener('auth:expired', onExpired);
    const token = sessionStorage.getItem('access_token');
    if (!token) { setLoading(false); return () => window.removeEventListener('auth:expired', onExpired); }
    authService.me().then(setUser).catch(clearSession).finally(() => setLoading(false));
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const acceptAuth = (result) => {
    sessionStorage.setItem('access_token', result.access_token);
    setUser(result.user);
  };

  return <AuthContext.Provider value={{ user, loading, acceptAuth, logout: clearSession, setUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
