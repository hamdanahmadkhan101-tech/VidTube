import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * UI Store using Zustand
 * Manages UI-related global state (theme, sidebar, modals, etc.)
 */

const useUIStore = create(
  persist(
    (set, get) => ({
      // State
      theme: 'dark', // 'light' | 'dark' | 'auto'
      sidebarOpen: false,
      playerVolume: 1.0,
      playerMuted: false,
      toastQueue: [],

      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      openSidebar: () => set({ sidebarOpen: true }),
      closeSidebar: () => set({ sidebarOpen: false }),

      setPlayerVolume: (volume) => set({ playerVolume: Math.max(0, Math.min(1, volume)) }),
      setPlayerMuted: (muted) => set({ playerMuted: muted }),
      toggleMute: () => set((state) => ({ playerMuted: !state.playerMuted })),

      addToast: (toast) =>
        set((state) => ({
          toastQueue: [...state.toastQueue, { ...toast, id: Date.now() }],
        })),

      removeToast: (id) =>
        set((state) => ({
          toastQueue: state.toastQueue.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        playerVolume: state.playerVolume,
        playerMuted: state.playerMuted,
      }),
    }
  )
);

// Initialize theme on store creation
const { setTheme } = useUIStore.getState();
setTheme(useUIStore.getState().theme);

export default useUIStore;
