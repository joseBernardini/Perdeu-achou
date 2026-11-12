import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import authService from '../services/authService';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children, service = authService }) {
  const [state, setState] = useState(() => ({ status: 'loading', user: service.getCurrentUser() }));
  const [notice, setNotice] = useState(null);
  const signingOutRef = useRef(false);
  const previousUserRef = useRef(state.user);

  useEffect(
    () =>
      service.onAuthStateChanged((user) => {
        const previousUser = previousUserRef.current;
        previousUserRef.current = user;

        const pendingError = service.consumeLastError?.();
        if (pendingError?.name === 'AccountDisabledError') {
          setNotice({ type: 'account-disabled', message: pendingError.message });
        } else if (previousUser && !user && !signingOutRef.current) {
          setNotice({ type: 'session-expired', message: 'Sua sessão expirou ou foi encerrada. Entre novamente para continuar.' });
        } else if (user) {
          setNotice(null);
        }

        signingOutRef.current = false;
        setState({ status: 'ready', user });
      }),
    [service]
  );

  const signIn = useCallback((values) => service.signIn(values), [service]);
  const signUp = useCallback((values) => service.signUp(values), [service]);
  const requestPasswordReset = useCallback((values) => service.requestPasswordReset(values), [service]);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    try {
      await service.signOut();
    } catch (error) {
      signingOutRef.current = false;
      throw error;
    }
  }, [service]);

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isAuthenticated: Boolean(state.user),
      isAdmin: state.user?.role === USER_ROLES.admin,
      isDemo: Boolean(service.isDemo),
      configurationError: service.configurationError ?? null,
      notice,
      dismissNotice,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
    }),
    [state, service, notice, dismissNotice, signIn, signUp, signOut, requestPasswordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return context;
}
