import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,

  setAuth: (user, token) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  initAuth: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        set({ token, user: JSON.parse(user) });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
  },
}));
