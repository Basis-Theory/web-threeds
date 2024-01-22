const common = {
  automock: false,
  coveragePathIgnorePatterns: ['test', 'dist'],
  transform: { '^.+\\.(t|j)sx?$': ['@swc/jest'] },
  testPathIgnorePatterns: ['cypress'],
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
};

module.exports = {
  projects: [
    {
      ...common,
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
    },
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      lines: 80,
      functions: 80,
    },
  },
};
