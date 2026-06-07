import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        set({ user, token });
      },

      logout: () => {
        set({ user: null, token: null });
      },

      initAuth: () => {
        // Hydration happens automatically with persist middleware
        // This empty function remains to prevent breaking existing App.jsx calls
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
