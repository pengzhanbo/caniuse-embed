import fs from 'node:fs/promises'
import process from 'node:process'

/**
 * 原子写入：先写临时文件再 rename，避免进程中断后留下截断的缓存文件
 */
export async function writeFileAtomic(file: string, content: string): Promise<void> {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  try {
    await fs.writeFile(tmp, content, 'utf-8')
    await fs.rename(tmp, file)
  }
  catch (error) {
    await fs.rm(tmp, { force: true }).catch(() => {})
    throw error
  }
}
