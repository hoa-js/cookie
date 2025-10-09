import neostandard from 'neostandard'

export default neostandard({
  typescript: true,
  prettier: true,
  tsconfigRootDir: import.meta.dirname,
  files: ['**/*.ts', '**/*.js'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
  },
})
