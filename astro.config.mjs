import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vercel from '@astrojs/vercel'
import { defineConfig } from 'astro/config'
import { transform } from 'esbuild'
import { build } from 'tsup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
        'astro:config:setup': ({ config }) => {
          config.vite.plugins ??= []
          config.vite.plugins.push({
            name: 'ciu-embed-script',
            async load(id) {
              if (id === '/embed.js') {
                const code = await fs.readFile(path.join(__dirname, 'src/scripts/embed.ts'), 'utf-8')
                return code
              }
            },
            async transform(code, id) {
              if (id === '/embed.js') {
                return await transform(code, { loader: 'ts' })
              }
            },
          })
        },
      },
    },
    {
      name: 'ciu-embed-scripts-bundle',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const output = path.join(path.dirname(fileURLToPath(dir)), 'client')

          await build({
            entry: ['src/scripts/embed.ts'],
            outDir: output,
            format: 'esm',
            platform: 'browser',
            minify: true,
            dts: false,
            clean: false,
          })
        },
      },
    },
  ],
})
