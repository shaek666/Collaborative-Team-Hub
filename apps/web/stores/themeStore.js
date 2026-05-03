import { create } from 'zustand';

export const useThemeStore = create((set) => ({
  theme: 'dark',

  initTheme: () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored) {
      set({ theme: stored });
      document.documentElement.classList.toggle('light', stored === 'light');
      return;
    }

    const prefersLight = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial = prefersLight ? 'light' : 'dark';
    set({ theme: initial });
    document.documentElement.classList.toggle('light', initial === 'light');
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', next);
        document.documentElement.classList.toggle('light', next === 'light');
      }
      return { theme: next };
    });
  },
}));
