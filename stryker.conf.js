/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'command',
  commandRunner: { command: 'npm run test' },
  coverageAnalysis: 'off',
};
