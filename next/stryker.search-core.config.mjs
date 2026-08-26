export default {
  mutate: ['packages/search-core/src/index.ts'],
  testFiles: ['packages/search-core/**/*.test.ts'],
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
    related: false
  },
  coverageAnalysis: 'perTest',
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
    fileName: '../mutation-spike-artifacts/search-core-mutation.json'
  },
  thresholds: {
    high: 80,
    low: 60,
    break: null
  },
  cleanTempDir: 'always'
};
