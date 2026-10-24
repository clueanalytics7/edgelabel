import { useEffect } from 'react';

/**
 * Apply and persist the chosen theme.
 * Reads from localStorage on first call; responds to system preference changes.
 */
export function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.classList.toggle('dark', effective === 'dark');
  localStorage.setItem('theme', theme);
}

/** Hook: keep theme in sync when it changes or system preference changes. */
export function useTheme(theme) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => applyTheme(theme);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [theme]);
}

export function savedTheme() {
  return localStorage.getItem('theme') || 'system';
}
