// Minimal stub types for next-themes to satisfy type-checking where used.
// Extend as needed with real signatures if you rely on deeper typings.
declare module 'next-themes' {
  export interface ThemeProviderProps {
    children?: React.ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    forcedTheme?: string;
    storageKey?: string;
    themes?: string[];
    value?: Record<string, string>;
  }
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
  export function useTheme(): { theme?: string; setTheme: (theme: string) => void; systemTheme?: string };
}
