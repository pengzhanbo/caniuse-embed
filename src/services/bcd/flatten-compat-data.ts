import type { CompatStatement, Identifier } from '../../types'

export interface CompatData {
  compat: CompatStatement
  paths: string[]
  descriptions: string[]
}

/**
 * 扁平化处理
 * 使用 push/pop 模式替代数组复制，减少内存分配
 */
export function* flattenCompatData(data: Identifier): Generator<CompatData> {
  const paths: string[] = []
  const descriptions: string[] = []

  function* traverse(node: Identifier): Generator<CompatData> {
    const { __compat: compat, ...apis } = node
    if (compat)
      yield { compat, paths: paths.slice(), descriptions: descriptions.slice() }

    for (const key in apis) {
      paths.push(key)
      descriptions.push(apis[key]!.__compat?.description || '')
      yield* traverse(apis[key]!)
      paths.pop()
      descriptions.pop()
    }
  }

  yield* traverse(data)
}
