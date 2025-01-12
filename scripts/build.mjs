import * as esbuild from 'esbuild'
import * as fs from 'node:fs'

// 通过传递参数的方式，可以在脚本中使用不同的配置
const args = process.argv.slice(2)
const isDev = args.includes('--dev')

const buildJS = await esbuild
  .context({
    bundle: true,
    entryPoints: ['cli/index.ts'],
    outfile: 'dist/index.cjs',
    format: 'cjs',
    platform: 'node',
    target: 'node14',
    sourcemap: false,
    minify: true,
    minifyWhitespace: true, // 移除多余空格
    minifyIdentifiers: true, // 缩短变量名
    treeShaking: true,
    plugins: [
      {
        name: 'alias',
        setup({ onResolve, resolve }) {
          onResolve(
            { filter: /^prompts$/, namespace: 'file' },
            async ({ importer, resolveDir }) => {
              const result = await resolve('prompts/lib/index.js', {
                importer,
                resolveDir,
                kind: 'import-statement'
              })
              return result
            }
          )
        }
      },
      {
        name: 'build size',
        setup({ onEnd }) {
          onEnd(async () => {
            const outputFilePath = 'dist/index.cjs'
            try {
              const stats = await fs.promises.stat(outputFilePath)
              console.log(`build size: ${(stats.size / 1024).toFixed(2)} KB\n`)
            } catch {}
          })
        }
      }
    ]
  })
  .catch(() => process.exit(1))

if (isDev) {
  await buildJS.watch()
} else {
  await buildJS.rebuild()
  buildJS.dispose()
}
