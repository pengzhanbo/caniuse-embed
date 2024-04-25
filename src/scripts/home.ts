import Choices from 'choices.js'
import { customAlphabet } from 'nanoid'

const $ = (query: string, el?: HTMLElement) => (el || document).querySelector(query)
const nanoid = customAlphabet('0123456789abcdef', 4)

async function getFeatureList() {
  const list = await fetch('/features.json').then(res => res.json())
  return list as { label: string, value: string }[]
}
const featureSelect = $('#featuresSelect')! as HTMLSelectElement
const pastVersionSelect = $('#pastSelect')! as HTMLSelectElement
const futureVersionSelect = $('#futureSelect')! as HTMLSelectElement

const output = $('#output') as HTMLDivElement
const embed = $('.ciu-embed', output) as HTMLIFrameElement
const iframe = $('iframe', embed) as HTMLIFrameElement

const embedConfig = $('.embed-config') as HTMLDivElement
const embedCode = $('#embedCode') as HTMLPreElement

const featureChoices = new Choices(featureSelect, {
  renderChoiceLimit: 200,
})

featureChoices.setChoices(() => getFeatureList())

// eslint-disable-next-line no-new
new Choices(pastVersionSelect, {
  choices: [
    { label: 'No Past Version', value: '0' },
    ...Array(5).fill(0).map((_, i) => ({
      label: `Past Version (Current - ${i + 1})`,
      selected: i === 1,
      value: i + 1,
    })),
  ],
})

// eslint-disable-next-line no-new
new Choices(futureVersionSelect, {
  choices: [
    { label: 'No Future Version', value: '0' },
    ...Array(3).fill(0).map((_, i) => ({
      label: `Future Version (Current + ${i + 1})`,
      selected: i === 0,
      value: i + 1,
    })),
  ],
})

featureSelect.addEventListener('change', onChange)
pastVersionSelect.addEventListener('change', onChange)
futureVersionSelect.addEventListener('change', onChange)

function onChange() {
  const feature = featureSelect.value || ''
  const past = pastVersionSelect.value || ''
  const future = futureVersionSelect.value || ''
  if (!feature) {
    embedConfig.style.display = 'none'
    output.style.display = 'none'
    return
  }
  const meta = nanoid()
  const origin = window.location.origin
  embed.setAttribute('data-feature', feature)
  embed.setAttribute('data-past', past)
  embed.setAttribute('data-future', future)
  embed.setAttribute('data-meta', meta)
  const source = `/${feature}#past=${past}&future=${future}&meta=${meta}`
  iframe.src = `${origin}${source}`
  output.style.display = 'block'

  let content = `<p class="ciu-embed" data-feature="${feature}"`
  if (past)
    content += ` data-past="${past}"`
  if (future)
    content += ` data-future="${future}"`
  content += ` data-meta="${meta}"></p>`
  embedCode.textContent = content
  embedConfig.style.display = 'block'
}
