// ES module shim for MSW used by src/pages/_app.js dynamic import
export const worker = {
  start: (opts) => {
    // noop in containerized environments
    return Promise.resolve();
  },
};
