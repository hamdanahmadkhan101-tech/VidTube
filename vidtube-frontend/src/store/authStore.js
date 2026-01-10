import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from '../services/authService.js';

/**
 * Auth Store using Zustand
 * Manages authentication state globally
 */

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      loading: true,
      error: null,
      isAuthenticated: false,

      // Actions
      setLoading: (loading) => set({ loading }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user),
          error: null,
        }),

      setError: (error) => set({ error, loading: false }),

      // Initialize auth state on app load
      initialize: async () => {
        set({ loading: true, error: null });
        try {
          const res = await getCurrentUser();
          set({
            user: res.data.data,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null, // Don't set error on init - user might not be logged in
          });
        }
      },

      // Login action
      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const res = await apiLogin(credentials);
          const { user, accessToken } = res.data.data;

          if (accessToken) {
            Cookies.set('accessToken', accessToken, {
              sameSite: 'lax',
              secure: window.location.protocol === 'https:',
              path: '/',
            });
          }

          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          });

          return user;
        } catch (error) {
          const message =
            error.response?.data?.message ||
            'Failed to login. Please try again.';
          set({
            loading: false,
            error: message,
            isAuthenticated: false,
          });
          throw new Error(message);
        }
      },

      // Register action
      register: async (formData) => {
        set({ loading: true, error: null });
        try {
          const res = await apiRegister(formData);
          const user = res.data.data;

          set({
            loading: false,
            error: null,
            // Don't set user on registration - user must log in separately
          });

          return user;
        } catch (error) {
          const message =
            error.response?.data?.message ||
            'Failed to register. Please try again.';
          set({
            loading: false,
            error: message,
          });
          throw new Error(message);
        }
      },

      // Logout action
      logout: async () => {
        try {
          await apiLogout();
        } catch (error) {
          // Ignore logout errors
        } finally {
          Cookies.remove('accessToken', { path: '/' });
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      // Refresh user data
      refreshUser: async () => {
        try {
          const res = await getCurrentUser();
          set({
            user: res.data.data,
            isAuthenticated: true,
            error: null,
          });
          return res.data.data;
        } catch (error) {
          console.error('Failed to refresh user:', error);
          return null;
        }
      },
    }),
    {
      name: 'auth-storage', // LocalStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user data, not loading/error states
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
