const { JSDOM } = require('jsdom');
const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
const ToastProvider = require('../components/NotificationToast.tsx').ToastProvider;

(async () => {
  // Setup JSDOM global
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost' });
  global.window = dom.window;
  global.document = dom.window.document;
  // Node >=20에서는 navigator를 직접 할당하면 TypeError가 발생할 수 있어 defineProperty 사용
  Object.defineProperty(global, 'navigator', { value: { userAgent: 'node.js' }, writable: false, configurable: true });
  // jsdom이 제공하지 않는 경우를 대비한 폴백
  global.localStorage = dom.window.localStorage || (function(){
    let store = {};
    return {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; },
    };
  })();

  // Render ToastProvider
  // 올바른 JSX 구조로 수정: children을 배열로 전달
  render(
    React.createElement(
      ToastProvider,
      null,
      [React.createElement('div', { key: 'root' }, 'root')]
    )
  );

  // Dispatch event
  window.dispatchEvent(new dom.window.CustomEvent('app:notification', { detail: { message: 'X', type: 'info' } }));

  // Wait for toast
  try {
    await waitFor(() => screen.getByText('X'), { timeout: 2000 });
    console.log('First toast found');
  } catch (e) {
    console.error('First toast not found');
    process.exit(2);
  }

  // Dispatch duplicate quickly
  window.dispatchEvent(new dom.window.CustomEvent('app:notification', { detail: { message: 'X', type: 'info' } }));
  // Wait briefly and count elements
  await new Promise((r) => setTimeout(r, 500));
  const nodes = document.querySelectorAll('div');
  // crude check: should not have duplicate message elements more than 1
  const count = Array.from(nodes).filter(n => n.textContent && n.textContent.includes('X')).length;
  if (count > 1) {
    console.error('Duplicate not suppressed, count=', count);
    process.exit(3);
  }

  // After 2s dispatch again
  await new Promise((r) => setTimeout(r, 1600));
  window.dispatchEvent(new dom.window.CustomEvent('app:notification', { detail: { message: 'X', type: 'info' } }));
  await new Promise((r) => setTimeout(r, 200));
  const count2 = Array.from(document.querySelectorAll('div')).filter(n => n.textContent && n.textContent.includes('X')).length;
  if (count2 < 1) {
    console.error('Toast missing after spaced dispatch');
    process.exit(4);
  }

  console.log('PASS: dedupe behavior OK');
  process.exit(0);
})();
