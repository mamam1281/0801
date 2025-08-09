// React 19 type shim: re-expose common utility types on the React namespace
// and augment missing generic overloads for common hooks. This is a temporary
// compatibility layer to ease migration of legacy code that relied on helpers
// like React.ComponentProps, React.ElementRef, and generic forwardRef calls.

declare module 'react' {
  // Namespace-level aliases so `React.ComponentProps` resolves in legacy code
  // Keep these very loose to avoid coupling, but DO NOT override function types.
  namespace React {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ComponentProps<T> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ComponentPropsWithoutRef<T> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ElementRef<T> = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type CSSProperties = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type ReactNode = any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type KeyboardEvent<T = Element> = any;
  }

  // Export aliases at module root for `import type { ... } from 'react'` patterns
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ComponentProps<T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ComponentPropsWithoutRef<T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ElementRef<T> = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type CSSProperties = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type ReactNode = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type KeyboardEvent<T = Element> = any;
}

export {};
