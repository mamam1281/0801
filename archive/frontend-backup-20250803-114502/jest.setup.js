// jest.setup.js
import '@testing-library/jest-dom'; // Extends Jest with custom matchers for DOM elements
import React from 'react';

// jest.setup.js
import '@testing-library/jest-dom'; // Extends Jest with custom matchers for DOM elements

// Framer Motion 모킹 - 외부 변수 참조 없이 안전하게 처리
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      // framer motion 속성들을 제거하고 나머지 props만 전달
      const { whileHover, whileTap, animate, initial, exit, transition, ...restProps } = props;
      return require('react').createElement('div', restProps, children);
    },
    button: ({ children, ...props }) => {
      const { whileHover, whileTap, animate, initial, exit, transition, ...restProps } = props;
      return require('react').createElement('button', restProps, children);
    },
    span: ({ children, ...props }) => {
      const { whileHover, whileTap, animate, initial, exit, transition, ...restProps } = props;
      return require('react').createElement('span', restProps, children);
    },
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock canvas confetti as it might not work well in JSDOM
jest.mock('canvas-confetti', () => ({
  __esModule: true, // This is important for ES modules
  default: jest.fn(), // Default export mock
  // If it also has named exports that are used, mock them too:
  // create: jest.fn().mockReturnValue(jest.fn()),
}));

// Mock useSound hook as it involves audio elements not well supported in JSDOM
jest.mock('use-sound', () => ({
    __esModule: true,
    default: jest.fn(() => [jest.fn(), { stop: jest.fn(), isPlaying: false }]), // Returns a mock play function and controls object
}));
