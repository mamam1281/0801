// Minimal MSW worker shim so production/dev containers that import this file don't fail
// Real mocks are only used during local development; this noop worker keeps imports safe.
const worker = {
  start: (opts) => {
    // noop in containerized environments where msw is not used
    return Promise.resolve();
  },
};

module.exports = { worker };
