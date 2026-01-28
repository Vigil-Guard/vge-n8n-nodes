module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'n8n-nodes-base'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    es2019: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'n8n-nodes-base/node-param-description-boolean-without-whether': 'error',
    'n8n-nodes-base/node-class-description-credentials-name-unsuffixed': 'error',
    'n8n-nodes-base/node-param-default-missing': 'error',
    'n8n-nodes-base/node-param-description-empty-string': 'error',
    'n8n-nodes-base/cred-class-field-name-unsuffixed': 'error',
    'n8n-nodes-base/cred-class-field-type-options-password-missing': 'error',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js', '!.eslintrc.js'],
};
