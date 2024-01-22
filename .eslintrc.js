module.exports = {
  root: true,
  env: {
    browser: false,
    es6: true,
    node: true,
    'jest/globals': true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'jest', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  rules: {
    'unicorn/no-null': 'warn',},
  ignorePatterns: ['**/*.cjs', '**/*.mjs', '**/*.js', 'jest.config.ts'],
};