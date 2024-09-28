import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vercel from '@astrojs/vercel/serverless'
import { defineConfig } from 'astro/config'

import { build } from 'tsup'

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
      name: 'ciu-embed-scripts-bundle',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const output = path.join(path.dirname(fileURLToPath(dir)), 'static')

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
