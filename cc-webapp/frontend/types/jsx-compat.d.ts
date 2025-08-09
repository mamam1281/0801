// Temporary JSX compatibility shim to ease React 19 migration
// Loosen the JSX.Element type so library components typed as ReactNode are accepted
// Do not ship this to production. Remove after proper typing fixes.

export {};

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Element = any;
  }
}
