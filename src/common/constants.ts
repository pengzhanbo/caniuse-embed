export const API = {
  bcd: 'https://unpkg.com/@mdn/browser-compat-data',
  // caniuse: 'https://api.pengzhanbo.cn/caniuse',
  caniuse: 'https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json',
}

export const BROWSERS = ['ie', 'edge', 'firefox', 'chrome', 'safari', 'ios_saf', 'op_mini', 'and_chr', 'android', 'samsung'] as const

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

export const PERIODS = ['past_5', 'past_4', 'past_3', 'past_2', 'past_1', 'current', 'future_1', 'future_2', 'future_3'] as const

export const MDN_BROWSERS_KEY = {
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

export const FEATURE_IDENTIFIERS = {
  supported: 'y',
  unsupported: 'n',
  partial: 'a',
  unknown: 'u',
  prefixed: 'x',
  flagged: 'd',
}
