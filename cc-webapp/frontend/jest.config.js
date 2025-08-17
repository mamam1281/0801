// Delegated to TypeScript config to avoid duplicate auto-detection conflict.
// Keep this shim so tools expecting .js config still work.
// If you remove this file, ensure IDE/Jest runner is pointed at jest.config.ts.
module.exports = require('./jest.config.ts').default;
