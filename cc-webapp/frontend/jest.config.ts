import nextJest from 'next/jest'

// Create a Next.js-aware Jest config so TS/JSX and module aliases work out of the box
const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '^.+\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
}

export default createJestConfig(customJestConfig)
