import { useAuthStore } from '../store/index.js';

/**
 * Updated useAuth hook using Zustand instead of Context API
 * Provides backward compatibility with existing components
 */
export default function useAuth() {
  const {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  } = useAuthStore((state) => ({
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    login: state.login,
    register: state.register,
    logout: state.logout,
    refreshUser: state.refreshUser,
  }));

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };
}
