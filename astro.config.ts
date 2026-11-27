import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import { build } from 'rolldown'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const embedEntry = path.join(__dirname, 'src/scripts/embed.ts')

// dev 下按入口文件的 mtime 缓存打包结果，避免每次刷新都重新跑 rolldown
let embedCache: { mtimeMs: number, code: string } | null = null

async function buildEmbedScript() {
  const { mtimeMs } = await fs.stat(embedEntry)
  if (embedCache && embedCache.mtimeMs === mtimeMs)
    return embedCache.code

  const result = await build({
    input: 'src/scripts/embed.ts',
    cwd: __dirname,
    write: false,
    output: { format: 'esm', sourcemap: false, file: 'out.js', minify: true },
    platform: 'browser',
    treeshake: true,
    tsconfig: true,
  })
  const code = result.output[0].code
  embedCache = { mtimeMs, code }
  return code
}

// https://astro.build/config
export default defineConfig({
  site: 'https://caniuse-embed.vercel.app',
  devToolbar: {
    enabled: false,
  },

  integrations: [
    {
      name: 'ciu-embed-scripts',
      hooks: {
        'astro:server:setup': ({ server }) => {
          server.middlewares.use(async (req, res, next) => {
            const { pathname } = new URL(req.url || '/', 'http://localhost')
            if (pathname === '/embed.js') {
              res.setHeader('Content-Type', 'text/javascript;charset=utf-8')
              res.setHeader('Cache-Control', 'no-store')
              res.end(await buildEmbedScript())
            }
            else {
              next()
            }
          })
        },
        // 只在产物生成后打包一次
        // （`astro:build:setup` 会对 client / SSR 两个构建各触发一次，导致重复打包）
        'astro:build:done': async ({ dir, logger }) => {
          await fs.writeFile(new URL('embed.js', dir), await buildEmbedScript())
          logger.info('embed.js generated')
        },
      },
    },
  ],
})
