import { defineConfig } from 'tsdown'

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
    outExtension () {
      return { js: '.mjs' }
    },
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
      return { js: '.cjs' }
    },
    esbuildOptions (options) {
      options.drop = ['console', 'debugger']
      options.legalComments = 'none'
    }
  }
])
