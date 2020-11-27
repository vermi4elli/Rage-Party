/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'jest',
  jest: {
    'enableFindRelatedTests': false
  },
  mutate: [ 'src/scripts/contain.js' ],
  commandRunner: { command: 'npm run test' },
  coverageAnalysis: 'off',
};
