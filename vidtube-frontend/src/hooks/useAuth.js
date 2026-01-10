import { useAuthStore } from "../store/index.js";
import { shallow } from "zustand/shallow";

/**
 * Updated useAuth hook using Zustand instead of Context API
 * Provides backward compatibility with existing components
 */
export default function useAuth() {
  const selected = useAuthStore(
    (state) => ({
      user: state.user,
      loading: state.loading,
      error: state.error,
      isAuthenticated: state.isAuthenticated,
      login: state.login,
      register: state.register,
      logout: state.logout,
      refreshUser: state.refreshUser,
    }),
    shallow
  );

  return selected;
}
