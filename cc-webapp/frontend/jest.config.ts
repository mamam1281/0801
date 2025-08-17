import type { Config } from 'jest';
// NOTE: 단일 Jest 설정 유지 정책.
// 기존 duplicate (jest.config.js) 제거: VSCode Jest 확장과 CLI 모두 이 파일만 사용.
// Next.js 15 환경에서도 ts-jest 트랜스폼만으로 충분 (next/jest 래퍼 필요 시 추후 주석 추가).

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
