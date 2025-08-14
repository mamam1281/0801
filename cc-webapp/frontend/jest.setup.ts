/// <reference types="jest" />
import '@testing-library/jest-dom';

// Reduce console noise in smoke tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const msg = args.join(' ');
    if (msg.includes('Warning:')) return;
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
