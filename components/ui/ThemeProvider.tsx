'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="survivebase-theme"
      value={{ dark: 'dark', light: 'light' }}
    >
      {children}
    </NextThemesProvider>
  );
}
