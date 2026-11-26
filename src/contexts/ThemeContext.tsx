import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'emerald' | 'amber' | 'rose' | 'slate' | 'classic';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ALL_THEMES: Theme[] = ['light', 'dark', 'emerald', 'amber', 'rose', 'slate', 'classic'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('theme') as Theme | null;
      return saved && ALL_THEMES.includes(saved) ? saved : 'classic';
    } catch {
      return 'classic';
    }
  });

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    ALL_THEMES.forEach((t) => {
      if (t !== theme) root.classList.remove(t);
    });
    if (!root.classList.contains(theme)) {
      root.classList.add(theme);
    }
    root.style.backgroundColor = '';
    root.style.color = '';
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
