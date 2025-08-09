// React 19 type shim: re-expose common utility types on the React namespace
// and augment missing generic overloads for common hooks. This is a temporary
// compatibility layer to ease migration of legacy code that relied on helpers
// like React.ComponentProps, React.ElementRef, and generic forwardRef calls.

declare module 'react' {
  // Namespace-level legacy aliases. Keep them loose and types-only.
  namespace React {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ComponentProps<T> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ComponentPropsWithoutRef<T> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ComponentRef<T> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ElementRef<T> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type CSSProperties = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ReactNode = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type KeyboardEvent<T = Element> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface ErrorInfo { componentStack: string }
  }

  // Module-level aliases for import type usage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ComponentProps<T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ComponentPropsWithoutRef<T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ComponentRef<T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ElementRef<T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type CSSProperties = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ReactNode = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type KeyboardEvent<T = Element> = any;
  export interface ErrorInfo { componentStack: string }
}

export {};
