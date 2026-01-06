import { createContext, useEffect, useReducer, useMemo } from 'react';
import Cookies from 'js-cookie';
import { getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/authService.js';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'INIT_START':
      return { ...state, loading: true, error: null };
    case 'INIT_SUCCESS':
      return { ...state, loading: false, user: action.payload, error: null };
    case 'INIT_ERROR':
      return { ...state, loading: false, user: null, error: action.payload };
    case 'LOGIN_START':
    case 'REGISTER_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return { ...state, loading: false, user: action.payload, error: null };
    case 'LOGIN_ERROR':
    case 'REGISTER_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      dispatch({ type: 'INIT_START' });
      try {
        const res = await getCurrentUser();
        if (!mounted) return;
        dispatch({ type: 'INIT_SUCCESS', payload: res.data.data });
      } catch (error) {
        if (!mounted) return;
        dispatch({ type: 'INIT_ERROR', payload: null });
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const res = await apiLogin(credentials);
      const { user, accessToken } = res.data.data;
      if (accessToken) {
        Cookies.set('accessToken', accessToken);
      }
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return user;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to login. Please try again.';
      dispatch({ type: 'LOGIN_ERROR', payload: message });
      throw new Error(message);
    }
  };

  const register = async (formData) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const res = await apiRegister(formData);
      const user = res.data.data;
      dispatch({ type: 'REGISTER_SUCCESS', payload: user });
      return user;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to register. Please try again.';
      dispatch({ type: 'REGISTER_ERROR', payload: message });
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      // ignore
    } finally {
      Cookies.remove('accessToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value = useMemo(
    () => ({
      user: state.user,
      loading: state.loading,
      error: state.error,
      login,
      register,
      logout,
      isAuthenticated: Boolean(state.user),
    }),
    [state.user, state.loading, state.error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;


