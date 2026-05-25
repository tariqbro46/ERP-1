import { useState, useEffect } from 'react';

export type LandingTheme = 'dark' | 'light';

export const useLandingTheme = () => {
  const [theme, setTheme] = useState<LandingTheme>(() => {
    return (localStorage.getItem('landing_theme') as LandingTheme) || 'dark';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme((localStorage.getItem('landing_theme') as LandingTheme) || 'dark');
    };
    window.addEventListener('landing_theme_changed', handleThemeChange);
    return () => {
      window.removeEventListener('landing_theme_changed', handleThemeChange);
    };
  }, []);

  return theme;
};
