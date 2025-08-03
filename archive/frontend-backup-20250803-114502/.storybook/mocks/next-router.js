// Next.js router 모킹 (legacy)
module.exports = {
  useRouter: () => ({
    push: () => Promise.resolve(true),
    replace: () => Promise.resolve(true),
    prefetch: () => Promise.resolve(),
    back: () => {},
    forward: () => {},
    reload: () => {},
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    isFallback: false,
    basePath: '',
    locale: undefined,
    locales: undefined,
    defaultLocale: undefined,
    isReady: true,
    isPreview: false,
    isLocaleDomain: false,
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
  }),
};
