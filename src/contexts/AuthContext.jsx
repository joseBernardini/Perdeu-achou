import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children, service = authService }) {
  const [state, setState] = useState(() => ({ status: 'loading', user: service.getCurrentUser() }));

  useEffect(() => service.onAuthStateChanged((user) => setState({ status: 'ready', user })), [service]);

  const signIn = useCallback((values) => service.signIn(values), [service]);
  const signUp = useCallback((values) => service.signUp(values), [service]);
  const signOut = useCallback(() => service.signOut(), [service]);
  const requestPasswordReset = useCallback((values) => service.requestPasswordReset(values), [service]);

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isAuthenticated: Boolean(state.user),
      isDemo: Boolean(service.isDemo),
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
    }),
    [state, service, signIn, signUp, signOut, requestPasswordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return context;
}
