import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'
import { transform } from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readEmbedFile = async () => await fs.readFile(path.join(__dirname, 'src/scripts/embed.ts'), 'utf-8')

// https://astro.build/config
export default defineConfig({
  site: 'https://caniuse.pengzhanbo.cn',
  devToolbar: {
    enabled: false,
  },
  output: 'server',
  adapter: vercel({
    isr: {
      expiration: 7 * 24 * 60 * 60, // 部署后页面最多缓存7天
    },
  }),
  integrations: [
    {
      name: 'ciu-embed-scripts',
      hooks: {
        'astro:server:setup': ({ server }) => {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/embed.js') {
              const source = await readEmbedFile()
              res.setHeader('Content-Type', 'text/javascript;charset=utf-8')
              const transformed = await transform(source, { loader: 'ts' })
              res.end(transformed.code)
            }
            else {
              next()
            }
          })
        },
        'astro:build:setup': ({ vite }) => {
          vite.plugins ??= []
          vite.plugins.push({
            name: 'ciu-home-script-bundle',
            async buildEnd() {
              const source = await readEmbedFile()
              const transformed = await transform(source, {
                loader: 'ts',
                format: 'esm',
                target: 'ES2020',
                platform: 'browser',
                minify: true,
              })
              this.emitFile({
                fileName: 'embed.js',
                type: 'asset',
                source: transformed.code,
              })
              console.log('Embed script bundle generated')
            },
          })
        },
      },
    },
  ],
})
