;(function () {
  async function getFeatureList() {
    const list = await fetch('/features.json').then(res => res.json())
    return list as { label: string, value: string }[]
  }
  const featureSelect = document.getElementById('featuresSelect')! as HTMLSelectElement
  const pastVersionSelect = document.getElementById('past')! as HTMLSelectElement
  const futureVersionSelect = document.getElementById('future')! as HTMLSelectElement

  const output = document.getElementById('output') as HTMLDivElement

  async function render() {
    const list = await getFeatureList()
    featureSelect.innerHTML = `<option value="">Select Feature</option>${list
      .map(({ label, value }) => `<option value="${value}">${label}</option>`)
      .join('\n')}`
  }

  featureSelect.addEventListener('change', onChange)
  pastVersionSelect.addEventListener('change', onChange)
  futureVersionSelect.addEventListener('change', onChange)

  function onChange() {
    const feature = featureSelect.value || ''
    const past = pastVersionSelect.value || ''
    const future = futureVersionSelect.value || ''
    if (!feature) {
      output.innerHTML = ''
      return
    }
    const source = `/${feature}#past=${past}&future=${future}`
    output.innerHTML = `<p class="ciu-embed" data-feature="${feature}" data-past="${past}" data-future="${future}"><iframe src="${source}" style="width:100%;height:330px;border:none;"></iframe></p>`
  }

  render()
})()
