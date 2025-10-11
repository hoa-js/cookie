import neostandard from 'neostandard'

export default [
  ...neostandard({
    ignores: ['dist/**', 'node_modules/**'],
    ts: true
  }),
  {
    files: ['src/**/*.ts', '__test__/**/*.ts'],
  }
]
