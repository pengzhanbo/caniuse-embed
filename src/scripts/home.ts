import Choices from 'choices.js'
import { DEFAULT_FUTURE, DEFAULT_PAST, MAX_FUTURE, MAX_PAST } from '../common/constants'

type Lang = 'en-US' | 'zh-CN'
type Theme = 'auto' | 'dark' | 'light'

interface Locale {
  noPast: string
  noFuture: string
  past: string
  future: string
  noFeature: string
  loadFailed: string
}
interface ChoicesItem {
  label: string
  value: string
}
interface FeatureItem extends ChoicesItem {
  baseline: boolean
}
type FeatureTuple = [label: string, value: string, baseline: boolean]

const locales: Record<Lang, Locale> = {
  'en-US': {
    noPast: 'No Past Version',
    noFuture: 'No Future Version',
    past: 'Up to {val} past version group(s)',
    future: 'Up to {val} future version group(s)',
    noFeature: 'Select a feature',
    loadFailed: 'Failed to load the feature list, please refresh the page.',
  },
  'zh-CN': {
    noPast: '不显示旧版本',
    noFuture: '不显示新版本',
    past: '最多显示 {val} 个过去版本分组',
    future: '最多显示 {val} 个未来版本分组',
    noFeature: '请选择一个特性',
    loadFailed: '特性列表加载失败，请刷新页面重试。',
  },
}

const $ = (query: string, el?: HTMLElement) => (el || document).querySelector(query)
const $$ = (query: string, el?: HTMLElement) => (el || document).querySelectorAll(query)

const featureSelect = $('#featuresSelect')! as HTMLSelectElement
const pastVersionSelect = $('#pastSelect')! as HTMLSelectElement
const futureVersionSelect = $('#futureSelect')! as HTMLSelectElement
const typeRadio = $$('input[name="embed-type"]') as NodeListOf<HTMLInputElement>
const langSelect = $('.lang-select') as HTMLSelectElement
const themeEl = $('.theme') as HTMLButtonElement
const rangeSetting = $('.range-setting') as HTMLDivElement
const rangeAttr = $('.range-attr') as HTMLDivElement
const embeds = $$('.ciu-embed, .ciu-baseline-embed')

const output = $('#output') as HTMLDivElement
const embed = $('.ciu-embed', output) as HTMLIFrameElement
const iframe = $('iframe', embed) as HTMLIFrameElement

const embedConfig = $('.embed-config') as HTMLDivElement
const embedCode = $('#embedCode') as HTMLPreElement

const lang: Lang = (document.documentElement.lang as Lang) || 'en-US'
const media = typeof window.matchMedia !== 'undefined'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

let theme: Theme = 'auto'
let type = 'caniuse'
let featureItems: FeatureItem[] = []
let featuresLoaded = false
let featureLoadError = false
let applyingChoices = false

const featureChoices = new Choices(featureSelect, {
  renderChoiceLimit: 1000,
  // label 来自上游数据，构建期已转为纯文本，禁止 HTML 注入
  allowHTML: false,
  shouldSort: false,
  searchResultLimit: 20,
  sorter: () => 0,
})

featureChoices.setChoices(() => loadFeatureChoices())

// eslint-disable-next-line no-new
new Choices(pastVersionSelect, {
  allowHTML: false,
  searchEnabled: false,
  choices: [
    { label: translate('noPast'), value: '0' },
    ...Array.from({ length: MAX_PAST }).fill(0).map((_, i) => ({
      label: translate('past', `${i + 1}`),
      selected: i + 1 === DEFAULT_PAST,
      value: i + 1,
    })),
  ],
})

// eslint-disable-next-line no-new
new Choices(futureVersionSelect, {
  allowHTML: false,
  searchEnabled: false,
  choices: [
    { label: translate('noFuture'), value: '0' },
    ...Array.from({ length: MAX_FUTURE }).fill(0).map((_, i) => ({
      label: translate('future', `${i + 1}`),
      selected: i + 1 === DEFAULT_FUTURE,
      value: i + 1,
    })),
  ],
})

applyTheme()
genScript()

on(featureSelect, 'change', onChange)
on(pastVersionSelect, 'change', onChange)
on(futureVersionSelect, 'change', onChange)
on(langSelect, 'change', onLangChange)

typeRadio.forEach(el => on(el, 'change', onChange))

on(themeEl, 'click', () => {
  // auto -> light -> dark -> auto
  theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'
  applyTheme()
  onChange()
})

media?.addEventListener('change', () => {
  // 只有 auto 模式跟随系统主题，此时需要同步更新 document 与嵌入参数
  if (theme === 'auto')
    applyTheme()
})

function applyTheme() {
  const isDark = theme === 'auto' ? Boolean(media?.matches) : theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.classList.toggle('light', theme === 'light')
  themeEl.dataset.theme = theme
  themeEl.setAttribute('aria-label', `Theme: ${theme}`)
  themeEl.setAttribute('aria-pressed', String(theme !== 'auto'))

  embeds.forEach((el) => {
    // auto 需要交给 iframe 自行判断系统主题
    attr(el as HTMLElement, { theme })
  })
}

function onChange() {
  const nextType = ($('input[name="embed-type"]:checked') as HTMLInputElement)?.value || 'caniuse'
  if (nextType !== type) {
    type = nextType
    // 切换嵌入类型时只保留当前类型可用的特性（例如 baseline 需要 baseline 数据）
    applyFeatureChoices()
  }

  const feature = featureSelect.value || ''
  const past = pastVersionSelect.value || ''
  const future = futureVersionSelect.value || ''

  rangeSetting.style.display = type === 'caniuse' ? 'block' : 'none'
  rangeAttr.style.display = type === 'caniuse' ? 'block' : 'none'
  if (!feature) {
    embedConfig.style.display = 'none'
    output.style.display = 'none'
    return
  }
  const data = type === 'caniuse' ? { past, future } : {}
  attr(embed, { feature, ...data })
  iframe.src = genSource(feature, data)
  output.style.display = 'block'
  embedCode.textContent = genCode({ feature, ...data })
  embedConfig.style.display = 'block'
}

function onLangChange() {
  // option 的 value 就是目标路径，避免用 language tag 猜路径（/en-US 并不存在）
  const target = langSelect.value || '/'
  location.href = target
}

async function loadFeatureChoices(): Promise<ChoicesItem[]> {
  try {
    const res = await fetch('/features.json')
    if (!res.ok)
      throw new Error(`${res.status} ${res.statusText}`)
    const list = await res.json() as FeatureTuple[]
    featureItems = list.map(([label, value, baseline]) => ({
      label,
      value,
      baseline: Boolean(baseline),
    }))
  }
  catch (error) {
    featureLoadError = true
    console.error('[caniuse-embed] failed to load features.json', error)
  }
  featuresLoaded = true
  return buildFeatureChoices()
}

function buildFeatureChoices(): ChoicesItem[] {
  const list: ChoicesItem[] = [{ label: translate('noFeature'), value: '' }]
  if (featureLoadError) {
    list.push({ label: translate('loadFailed'), value: '' })
    return list
  }
  const items = type === 'baseline'
    ? featureItems.filter(item => item.baseline)
    : featureItems
  return list.concat(items.map(({ label, value }) => ({ label, value })))
}

function applyFeatureChoices() {
  if (!featuresLoaded || applyingChoices)
    return
  applyingChoices = true
  try {
    const selected = featureSelect.value
    const list = buildFeatureChoices()
    featureChoices.setChoices(list, 'value', 'label', true, true, true)
    const valid = selected && list.some(item => item.value === selected)
    featureChoices.setChoiceByValue(valid ? selected : '')
  }
  finally {
    applyingChoices = false
  }
}

function translate(key: keyof Locale, val?: string): string {
  const content = locales[lang][key]
  return val ? content.replace('{val}', val) : content
}

function on<
  T extends HTMLElement = HTMLElement,
>(el: T, eventName: keyof HTMLElementEventMap, listener: EventListener) {
  el.addEventListener(eventName, listener)
}

function attr(el: HTMLElement, obj: Record<string, string>) {
  Object.keys(obj).forEach(key => el.setAttribute(`data-${key}`, obj[key]!))
}

function genScript() {
  $('#embedScript')!.textContent = `<script type="module" src="${location.origin}/embed.js"></script>`
}

function genCode(data: Record<string, string>) {
  const attrs = Object.keys(data)
    .filter(key => data[key])
    .map(key => ` data-${key}="${data[key]}"`)
    .join('')
  const themeAttr = theme === 'auto' ? '' : ` data-theme="${theme}"`
  return `<p class="ciu-${type === 'caniuse' ? '' : 'baseline-'}embed"${attrs}${themeAttr}></p>`
}

function genSource(feature: string, data: Record<string, string>) {
  const url = `${location.origin}/${feature}${type === 'caniuse' ? '' : '/baseline'}#`
  const params = new URLSearchParams(data)
  if (theme !== 'auto')
    params.set('theme', theme)
  return `${url}${params.toString()}`
}
