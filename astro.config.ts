import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vercel from '@astrojs/vercel'
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
  output: 'server',
  adapter: vercel(),

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
        'astro:build:setup': ({ vite }) => {
          vite.plugins ??= []
          vite.plugins.push({
            name: 'ciu-home-script-bundle',
            async buildEnd() {
              this.emitFile({
                fileName: 'embed.js',
                type: 'asset',
                source: await buildEmbedScript(),
              })
              console.log('Embed script bundle generated')
            },
          })
        },
      },
    },
  ],
})
