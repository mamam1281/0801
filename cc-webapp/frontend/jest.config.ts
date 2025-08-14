import type { Config } from 'jest';

const config: Config = {
	testEnvironment: 'jsdom',
	roots: ['<rootDir>'],
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	globals: {
		'test': true,
		'expect': true,
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
	},
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
	testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
	collectCoverageFrom: ['<rootDir>/**/*.{ts,tsx}', '!<rootDir>/.next/**', '!<rootDir>/node_modules/**'],
};

export default config;
