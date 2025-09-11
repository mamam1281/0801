// Suppress React 19 ref warnings in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function (...args) {
    // Suppress React 19 ref warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('element.ref was removed in React 19') ||
       args[0].includes('ref is now a regular prop'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = function (...args) {
    // Suppress React 19 ref warnings  
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('element.ref was removed in React 19') ||
       args[0].includes('ref is now a regular prop'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
