import type { FeatureDataVersions } from '../types'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const CDN = 'https://cdn.jsdelivr.net/npm'
const RESOLVE_API = 'https://data.jsdelivr.com/v1/packages/npm'

/**
 * 远程数据源
 *
 * 本项目的自动构建（GitHub Actions 每周触发的部署钩子）目标是
 * 「页面展示的兼容数据始终是上游最新发布的」，
 * 因此生产构建不会固定为本地 `node_modules` 中的版本，而是先解析
 * jsDelivr 上的最新发布版本，再请求该版本的具体文件。
 *
 * 这样做的好处：
 * - 拿到的是「已发布版本」而不是 `@master` 这类随时变化的 git 分支；
 * - 版本号是显式的，构建日志里可以直接看到本次使用的数据版本；
 * - 解析失败时回退到 `@latest`，不会因为 jsDelivr 的 API 抖动导致构建失败。
 *
 * 需要复现历史构建时，可以用环境变量把某个包固定到指定版本：
 *
 * ```bash
 * CIU_BCD_VERSION=8.1.11 CIU_CANIUSE_VERSION=1.0.30001828 pnpm build
 * ```
 */
export interface DataSourceSpec {
  /** npm 包名 */
  pkg: string
  /** 包内文件路径，空字符串表示使用包的默认入口 */
  file: string
  /** 用于固定版本的调试用环境变量 */
  env: string
}

export interface DataSource {
  pkg: string
  version: string
  url: string
}

export const DATA_SOURCES = {
  // @mdn/browser-compat-data
  bcd: { pkg: '@mdn/browser-compat-data', file: '', env: 'CIU_BCD_VERSION' },
  // caniuse-db
  caniuse: { pkg: 'caniuse-db', file: 'fulldata-json/data-2.0.json', env: 'CIU_CANIUSE_VERSION' },
  // web-features
  baseline: { pkg: 'web-features', file: 'data.json', env: 'CIU_WEBFEATURES_VERSION' },
} satisfies Record<string, DataSourceSpec>

async function resolveLatestVersion(pkg: string): Promise<string> {
  try {
    const res = await fetch(`${RESOLVE_API}/${pkg}/resolved?specifier=latest`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok)
      throw new Error(`HTTP ${res.status} ${res.statusText}`)

    const { version } = await res.json() as { version?: string }
    return version || 'latest'
  }
  catch (error) {
    console.warn(
      `[caniuse-embed] 无法解析 ${pkg} 的最新版本，回退到 @latest 地址。`,
      error instanceof Error ? error.message : error,
    )
    return 'latest'
  }
}

export async function resolveDataSource(spec: DataSourceSpec): Promise<DataSource> {
  const pinned = process.env[spec.env]?.trim()
  const version = pinned || await resolveLatestVersion(spec.pkg)
  const file = spec.file ? `/${spec.file}` : ''

  return {
    pkg: spec.pkg,
    version,
    url: `${CDN}/${spec.pkg}@${version}${file}`,
  }
}

/**
 * 解析全部数据源，并输出本次构建实际使用的版本
 */
export async function resolveDataSources(): Promise<Record<keyof typeof DATA_SOURCES, DataSource>> {
  const [bcd, caniuse, baseline] = await Promise.all([
    resolveDataSource(DATA_SOURCES.bcd),
    resolveDataSource(DATA_SOURCES.caniuse),
    resolveDataSource(DATA_SOURCES.baseline),
  ])

  // 构建日志需要看到本次实际使用的数据版本，便于排查「数据没有更新」类问题
  // eslint-disable-next-line no-console
  console.info(
    `[caniuse-embed] 数据源版本：${[bcd, caniuse, baseline]
      .map(source => `${source.pkg}@${source.version}`)
      .join(', ')}`,
  )

  return { bcd, caniuse, baseline }
}

/**
 * 读取 `node_modules` 中已安装数据集的版本
 *
 * 远程获取失败回退到本地时，产物需要如实记录实际使用的版本。
 */
export async function getLocalDataVersions(): Promise<FeatureDataVersions> {
  const read = async (pkg: string): Promise<string> => {
    try {
      const file = path.join(process.cwd(), 'node_modules', pkg, 'package.json')
      const pkgJson = JSON.parse(await fs.readFile(file, 'utf-8')) as { version?: string }
      return pkgJson.version || 'unknown'
    }
    catch {
      return 'unknown'
    }
  }

  return {
    bcd: await read(DATA_SOURCES.bcd.pkg),
    caniuse: await read(DATA_SOURCES.caniuse.pkg),
    webFeatures: await read(DATA_SOURCES.baseline.pkg),
  }
}
