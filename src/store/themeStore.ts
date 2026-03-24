import { create } from 'zustand';
import { createStorage } from '../utils/storage';

const storage = createStorage({ id: 'theme-storage' });

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
  loadTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggleTheme: () =>
    set((state) => {
      const newValue = !state.isDark;
      storage.set('theme_dark', newValue);
      return { isDark: newValue };
    }),
  loadTheme: () => {
    const saved = storage.getBoolean('theme_dark');
    if (saved !== undefined) set({ isDark: saved });
  },
}));
