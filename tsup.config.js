import { defineConfig } from 'tsup'

export default defineConfig([
  // ESM build
  {
    entry: ['src/index.ts'],
    format: 'esm',
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    minify: false,
    bundle: true,
    outDir: 'dist/esm',
    target: 'es2020',
    esbuildOptions (options) {
      options.drop = ['console', 'debugger']
      options.legalComments = 'none'
    }
  },
  // CJS build
  {
    entry: ['src/index.ts'],
    format: 'cjs',
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    minify: false,
    bundle: true,
    outDir: 'dist/cjs',
    target: 'es2020',
    outExtension () {
      return { js: '.js' }
    },
    esbuildOptions (options) {
      options.drop = ['console', 'debugger']
      options.legalComments = 'none'
    }
  }
])
