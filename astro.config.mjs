import { defineConfig } from 'astro/config'

import vercel from '@astrojs/vercel/serverless'

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
})
