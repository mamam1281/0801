import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// 테스트용 Provider 래퍼 (필요시 추가)
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

// 커스텀 render 함수
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// 재export everything
export * from '@testing-library/react';
export { customRender as render };

// 테스트 헬퍼 함수들
export const waitForAnimation = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const getByTestId = (container: Element, testId: string) => 
  container.querySelector(`[data-testid="${testId}"]`);

// This file is a utility module, not a test file
// Jest should ignore it since it doesn't have actual tests
export const getAllByTestId = (container: Element, testId: string) => 
  container.querySelectorAll(`[data-testid="${testId}"]`);
