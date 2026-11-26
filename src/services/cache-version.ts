import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

/**
 * 计算数据转换代码的版本
 */
export async function getTransformVersion(): Promise<string> {
  try {
    const dir = path.join(process.cwd(), 'src/services')
    const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true })
    const files = entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
      .map(entry => path.join(entry.parentPath, entry.name))
      .sort()

    const hash = crypto.createHash('sha1')
    for (const file of files)
      hash.update(await fs.readFile(file))
    return hash.digest('hex')
  }
  catch {
    return ''
  }
}
