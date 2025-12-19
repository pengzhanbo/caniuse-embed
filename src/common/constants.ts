import type { CaniuseStats } from '../types'

export const API = {
  // bcd: 'https://unpkg.com/@mdn/browser-compat-data',
  bcd: 'https://cdn.jsdelivr.net/npm/@mdn/browser-compat-data',
  // caniuse: 'https://api.pengzhanbo.cn/caniuse',
  // caniuse: 'https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json',
  caniuse: 'https://cdn.jsdelivr.net/gh/Fyrd/caniuse@master/fulldata-json/data-2.0.json',
}

export const BROWSERS = [
  'ie',
  'edge',
  'firefox',
  'chrome',
  'safari',
  'ios_saf',
  'op_mini',
  'and_chr',
  'android',
  'samsung',
] as const

export const BROWSERS_NAME = {
  ie: 'IE',
  edge: 'Edge',
  firefox: 'Firefox',
  chrome: 'Chrome',
  safari: 'Safari',
  ios_saf: 'Safari iOS',
  op_mini: 'Opera Mini',
  and_chr: 'Chrome Android',
  android: 'Android Browser',
  samsung: 'Samsung Internet',
}

export const PERIODS = [
  'past_5',
  'past_4',
  'past_3',
  'past_2',
  'past_1',
  'current',
  'future_1',
  'future_2',
  'future_3',
] as const

export const MAX_PAST = 5
export const MAX_FUTURE = 3

export const BCD_BROWSERS_TO_CANIUSE_BROWSERS: Record<string, string> = {
  ie: 'ie',
  edge: 'edge',
  firefox: 'firefox',
  chrome: 'chrome',
  safari: 'safari',
  ios_saf: 'safari_ios',
  op_mini: 'op_mini',
  and_chr: 'chrome_android',
  android: 'android',
  samsung: 'samsunginternet_android',
}

export const CANIUSE_BROWSER_TO_BCD_BROWSERS: Record<string, string> = {
  ie: 'ie',
  edge: 'edge',
  firefox: 'firefox',
  chrome: 'chrome',
  safari: 'safari',
  safari_ios: 'ios_saf',
  op_mini: 'op_mini',
  chrome_android: 'and_chr',
  android: 'android',
  samsunginternet_android: 'samsung',
}

type StatsKey = 'supported' | 'unsupported' | 'partial' | 'unknown' | 'prefixed' | 'flagged'
export const FEATURE_IDENTIFIERS: Record<StatsKey, CaniuseStats> = {
  supported: 'y', // 支持，即表示该特性是可用的
  unsupported: 'n', // 不支持
  partial: 'a', // 仅部分支持，即表示该特性仅部分可用
  unknown: 'u', // 未知
  prefixed: 'x', // 支持，但是需要前缀
  flagged: 'd', // 通过浏览器标识启用
} as const
