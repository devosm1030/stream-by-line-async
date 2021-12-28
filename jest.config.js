const coveragePathIgnorePatterns = ['/node_modules/', '.*\\.testhelper.js$', '/tests/work/', '.*\\.integration.js$', '/bin/']
// can push more depending on test type - ie: if (proces.argv.includes('--isIntegration=Y) coveragePathIgnorePatterns.push...)

module.exports = {
  resetModules: true,
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns,
  coverageThreshold: { global: { branches: 100, functions: 100, lines: 100, statements: 100 } },
  verbose: true,
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  testMatch: ['**/?(*.)+(test|integration).js'],
  coverageReporters: [
    'json',
    'lcov',
    'text',
    'clover',
    'cobertura'
  ],
  reporters: ['default', 'jest-junit']
  // setupFiles: ['path-to-some-file.js]
}
