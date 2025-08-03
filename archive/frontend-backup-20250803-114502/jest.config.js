// jest.config.js
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Optional: for global mocks/setup
  moduleNameMapper: {
    // Handle CSS imports (if you import CSS in components)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    // Handle module aliases (if you have them in jsconfig.json or tsconfig.json)
    // Ensure these match your actual aliases in jsconfig.json
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    // Add other aliases as needed, e.g., for '@/app', '@/lib' if you use them
  },
  transform: {
    // Use Babel for transforming JS/JSX/TS/TSX files, leveraging Next.js's Babel preset
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },  // Ignore Next.js build artifacts, node_modules, Cypress files, and test utility files
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/cypress/', '<rootDir>/__tests__/test-utils.tsx'],
  // transformIgnorePatterns might be needed if you have ES modules in node_modules that need transformation
  // Default: '/node_modules/'
  // If encountering issues with packages like framer-motion, you might need to adjust this:
  transformIgnorePatterns: [
    '/node_modules/(?!(framer-motion)/)', // Example: transform framer-motion
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
};
