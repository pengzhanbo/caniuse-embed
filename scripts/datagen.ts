import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { getFullData } from '../src/services/getFullData'
import { addFeatureByBCD, addFeatureByCIU } from '../src/services/featuresList'
import type { FeatureList } from '../src/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function datagen() {
  const start = performance.now()
  let current = start
  const end = () => {
    const _current = performance.now()
    const msg = `- time: ${_current - current}ms`
    current = _current
    return msg
  }

  console.log('[datagen] starting ...\n          fetching data ...')
  const { ciu, bcd, browsers } = await getFullData()

  console.log(`[datagen] fetch data success ! ${end()}\n           processing data ...`)
  const featureList: FeatureList = []

  addFeatureByCIU(ciu, browsers, featureList)
  addFeatureByBCD(bcd, browsers, featureList)

  const content = JSON.stringify(featureList)

  console.log(`[datagen] process data success ! ${end()}\n          writing data ...`)

  const filepath = path.resolve(__dirname, '../data')

  fs.mkdirSync(filepath, { recursive: true })

  await fs.promises.writeFile(path.join(filepath, 'features.json'), content, 'utf-8')

  console.log(`[datagen] write data success !${end()}\n\n`)

  console.log(`[datagen] Done! - total time: ${performance.now() - start}ms`)
}

datagen()
