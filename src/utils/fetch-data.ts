const DEFAULT_TIMEOUT = 60_000
const DEFAULT_RETRIES = 3

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 从远程获取 JSON 数据
 *
 * - 带超时：避免 CDN 挂起导致整个构建卡死
 * - 带重试：网络抖动不至于让构建失败
 * - 校验 `res.ok`：错误页 HTML 不会被当成 JSON 解析成难以定位的报错
 */
export async function fetchData<T>(
  url: string,
  options: { timeout?: number, retries?: number } = {},
): Promise<T> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  const retries = options.retries ?? DEFAULT_RETRIES

  let lastError: unknown

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(timeout),
      })

      if (!res.ok)
        throw new Error(`HTTP ${res.status} ${res.statusText}`)

      return await res.json() as T
    }
    catch (error) {
      lastError = error
      if (attempt > retries)
        break

      const delay = 2 ** (attempt - 1) * 1000
      console.warn(`[caniuse-embed] 请求失败（第 ${attempt} 次）: ${url}，${delay}ms 后重试。`)
      await sleep(delay)
    }
  }

  throw new Error(
    `[caniuse-embed] 获取数据失败: ${url}\n${lastError instanceof Error ? lastError.message : String(lastError)}`,
  )
}
