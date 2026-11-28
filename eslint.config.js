// @ts-check
import config from '@pengzhanbo/eslint-config-astro'

export default config({
  ignores: ['.vercel', 'data', '.astro', 'dist'],
}, [{
  files: ['**/*.md/*.js'],
  rules: {
    'antfu/no-top-level-await': 'off',
  },
}])
