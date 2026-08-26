export default {
  mutate: ['packages/content-renderer/src/index.ts'],
  testFiles: ['packages/content-renderer/**/*.test.ts'],
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
    related: false
  },
  coverageAnalysis: 'off',
  concurrency: 2,
  inPlace: true,
  reporters: ['clear-text', 'json'],
  clearTextReporter: {
    allowColor: false,
    allowEmojis: false,
    logTests: false,
    reportTests: false,
    reportMutants: true,
    reportScoreTable: true,
    skipFull: false
  },
  jsonReporter: {
    fileName: '../mutation-content-renderer-artifacts/content-renderer-mutation.json'
  },
  thresholds: {
    high: 80,
    low: 60,
    break: null
  },
  cleanTempDir: 'always'
};
