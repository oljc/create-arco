import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      dts: false,
      bundle: true
    }
  ],
  output: {
    minify: true
  },
  source: {
    entry: {
      index: './cli/index.ts'
    }
  }
})
