import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

/**
 * 转换逻辑所在目录：其中的任何改动都会影响数据结构
 */
const TRANSFORM_DIR = 'src/services'

/**
 * 转换逻辑依赖的工具与常量
 *
 * 这些文件不在 `src/services` 下，但同样决定了最终数据的形状与语义，
 * 例如版本号规范化、版本比较规则、浏览器/状态标识常量。
 */
const DEPENDENCY_FILES = [
  'src/utils/normalize-version.ts',
  'src/utils/compare-version.ts',
  'src/common/constants.ts',
]

/**
 * 计算数据转换代码的版本
 *
 * 版本变化时本地缓存（`data/cached.json`）立即失效，
 * 内容未变化时保持缓存命中。
 */
export async function getTransformVersion(): Promise<string> {
  try {
    const dir = path.join(process.cwd(), TRANSFORM_DIR)
    const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true })
    const files = [
      ...entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
        .map(entry => path.join(entry.parentPath, entry.name)),
      ...DEPENDENCY_FILES.map(file => path.join(process.cwd(), file)),
    ].sort()

    const hash = crypto.createHash('sha1')
    for (const file of files) {
      try {
        hash.update(await fs.readFile(file))
      }
      catch {
        // 依赖文件缺失时跳过（例如裁剪过的仓库），不影响其它文件的指纹
      }
    }
    return hash.digest('hex')
  }
  catch {
    return ''
  }
}
