// Playwright 타입 선언
/// <reference types="@playwright/test" />

declare global {
  var process: NodeJS.Process & {
    env: NodeJS.ProcessEnv;
  };
}
