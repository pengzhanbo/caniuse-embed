import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'astro/config'
import { build } from 'rolldown'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function buildEmbedScript() {
  const result = await build({
    input: 'src/scripts/embed.ts',
    cwd: __dirname,
    write: false,
    output: { format: 'esm', sourcemap: false, file: 'out.js', minify: true },
    platform: 'browser',
    treeshake: true,
    tsconfig: true,
  })
  return result.output[0].code
}

// https://astro.build/config
export default defineConfig({
  site: 'https://caniuse.pengzhanbo.cn',
  devToolbar: {
    enabled: false,
  },

  integrations: [
    {
      name: 'ciu-embed-scripts',
      hooks: {
        'astro:server:setup': ({ server }) => {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/embed.js') {
              res.setHeader('Content-Type', 'text/javascript;charset=utf-8')
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
