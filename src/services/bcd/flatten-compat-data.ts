import type { CompatStatement, Identifier } from '../../types'

export interface CompatData {
  compat: CompatStatement
  paths: string[]
  descriptions: string[]
}

/**
 * 扁平化处理
 */
export function* flattenCompatData(
  data: Identifier,
  list: CompatData[] = [],
  paths: string[] = [],
  descriptions: string[] = [],
): Generator<CompatData> {
  const { __compat: compat, ...apis } = data
  if (compat)
    yield { compat, paths: [...paths], descriptions: [...descriptions] }

  for (const key in apis) {
    yield* flattenCompatData(
      apis[key]!,
      list,
      [...paths, key],
      [...descriptions, apis[key]!.__compat?.description || ''],
    )
  }
}
