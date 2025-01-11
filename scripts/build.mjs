import * as esbuild from 'esbuild'

await esbuild
  .build({
    bundle: true, // 打包成一个文件
    entryPoints: ['cli/index.ts'], // 入口文件
    outfile: 'dist/index.cjs', // 输出文件
    format: 'cjs',
    platform: 'node', // 针对 Node.js 环境
    target: 'node14',
    sourcemap: false,
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
      }
    ]
  })
  .catch(() => process.exit(1))
