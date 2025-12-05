import Choices from 'choices.js'
import { customAlphabet } from 'nanoid'

type Lang = 'en-US' | 'zh-CN'
type Theme = 'auto' | 'dark' | 'light'

interface Locale {
  noPast: string
  noFuture: string
  past: string
  future: string
}
interface ChoicesItem {
  label: string
  value: string
}

const locales: Record<Lang, Locale> = {
  'en-US': {
    noPast: 'No Past Version',
    noFuture: 'No Future Version',
    past: 'Past Version (Current Version - {val})',
    future: 'Future Version (Current Version + {val})',
  },
  'zh-CN': {
    noPast: '不显示旧版本',
    noFuture: '不显示新版本',
    past: '旧版本 (当前版本 - {val})',
    future: '未来版本 (当前版本 + {val})',
  },
}

const $ = (query: string, el?: HTMLElement) => (el || document).querySelector(query)
const $$ = (query: string, el?: HTMLElement) => (el || document).querySelectorAll(query)
const nanoid = customAlphabet('0123456789abcdef', 4)

const featureSelect = $('#featuresSelect')! as HTMLSelectElement
const pastVersionSelect = $('#pastSelect')! as HTMLSelectElement
const futureVersionSelect = $('#futureSelect')! as HTMLSelectElement
const langSelect = $('.lang-select') as HTMLSelectElement
const themeEl = $('.theme') as HTMLDivElement
const embeds = $$('.ciu-embed')

const output = $('#output') as HTMLDivElement
const embed = $('.ciu-embed', output) as HTMLIFrameElement
const iframe = $('iframe', embed) as HTMLIFrameElement

const embedConfig = $('.embed-config') as HTMLDivElement
const embedCode = $('#embedCode') as HTMLPreElement

const lang: Lang = (document.documentElement.lang as Lang) || 'en-US'
let theme: Theme = 'auto'

const featureChoices = new Choices(featureSelect, {
  renderChoiceLimit: 1000,
  allowHTML: false,
  shouldSort: false,
  searchResultLimit: 20,
  sorter: () => 0,
})

featureChoices.setChoices(() => getFeatureList())

// eslint-disable-next-line no-new
new Choices(pastVersionSelect, {
  allowHTML: false,
  searchEnabled: false,
  choices: [
    { label: translate('noPast'), value: '0' },
    ...Array.from({ length: 5 }).fill(0).map((_, i) => ({
      label: translate('past', `${i + 1}`),
      selected: i === 1,
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
    ...Array.from({ length: 3 }).fill(0).map((_, i) => ({
      label: translate('future', `${i + 1}`),
      selected: i === 0,
      value: i + 1,
    })),
  ],
})

genScript()

on(featureSelect, 'change', onChange)
on(pastVersionSelect, 'change', onChange)
on(futureVersionSelect, 'change', onChange)
on(langSelect, 'change', onLangChange)

on(themeEl, 'click', () => {
  if (theme === 'auto')
    theme = 'light'
  else if (theme === 'light')
    theme = 'dark'
  else
    theme = 'auto'
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.classList.toggle('light', theme === 'light')

  embeds.forEach((embed) => {
    attr(embed as HTMLElement, { theme: theme === 'dark' ? 'dark' : 'light' })
  })
  onChange()
})

if (typeof window.matchMedia !== 'undefined') {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  if (theme === 'auto')
    document.documentElement.classList.toggle('dark', media.matches)

  media.addEventListener('change', (ev) => {
    if (theme === 'auto') {
      document.documentElement.classList.toggle('dark', ev.matches)
      embeds.forEach((embed) => {
        attr(embed as HTMLElement, { theme: ev.matches ? 'dark' : 'light' })
      })
      onChange()
    }
  })
}

function onChange() {
  const feature = featureSelect.value || ''
  const past = pastVersionSelect.value || ''
  const future = futureVersionSelect.value || ''
  if (!feature) {
    embedConfig.style.display = 'none'
    output.style.display = 'none'
    return
  }
  const data = { past, future, meta: nanoid() }
  attr(embed, { feature, ...data })
  iframe.src = `${genSource(feature, data)}&theme=${theme === 'dark' ? 'dark' : 'light'}`
  output.style.display = 'block'
  embedCode.textContent = genCode({ feature, ...data })
  embedConfig.style.display = 'block'
}

function onLangChange() {
  const current = langSelect.value as Lang
  const origin = location.origin
  location.href = `${origin}/${current}`
}

async function getFeatureList(): Promise<ChoicesItem[]> {
  const list = await fetch('/features.json').then(res => res.json())
  return list as ChoicesItem[]
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
  let content = '<p class="ciu-embed"'
  Object.keys(data).forEach((key) => {
    if (data[key])
      content += ` data-${key}="${data[key]}"`
  })
  return content += '></p>'
}

function genSource(feature: string, data: Record<string, string>) {
  const url = `${location.origin}/${feature}#`
  const params = new URLSearchParams(data)
  return `${url}${params.toString()}`
}
