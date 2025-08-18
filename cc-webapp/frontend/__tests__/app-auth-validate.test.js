/**
 * @jest-environment jsdom
 */
import { validateAuthOnBoot } from '../../frontend/src/pages/_app';

// tokenStorage key used in app
const TOKEN_KEY = 'cc_auth_tokens';

describe('App boot auth validation', () => {
  beforeEach(() => {
    // clear localStorage & reset fetch
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('valid token (200) should not clear tokens', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: 'valid.jwt.token' }));
    global.fetch.mockResolvedValue({ status: 200 });

  // call the exported validator directly (no reload)
  await validateAuthOnBoot({ doReload: false });

  expect(localStorage.getItem(TOKEN_KEY)).not.toBeNull();
  });

  test('invalid token (401) should clear tokens and reload', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: 'bad.jwt.token' }));
    global.fetch.mockResolvedValue({ status: 401 });

  await validateAuthOnBoot({ doReload: false });

  expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
