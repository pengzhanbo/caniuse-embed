/**
 * @module types/bcd
 *
 * @repo {@link https://github.com/mdn/browser-compat-data}
 * @jsonschema {@link https://github.com/GoogleChrome/webstatus.dev/blob/main/jsonschema/mdn_browser-compat-data/browsers.schema.json}
 *
 * @description
 * MDN Browser Compatibility Data
 */

/**
 * 已知浏览器的名称
 */
export type BrowserName = 'bun' | 'chrome' | 'chrome_android' | 'deno' | 'edge' | 'firefox' | 'firefox_android' | 'ie' | 'nodejs' | 'oculus' | 'opera' | 'opera_android' | 'safari' | 'safari_ios' | 'samsunginternet_android' | 'webview_android' | 'webview_ios'

type VersionValue = string | false

/**
 * 已知浏览器，以及每个浏览器的版本信息
 */
export type Browsers = Record<BrowserName, BrowserStatement>
/**
 * 浏览器类型。
 * 用于 `definition` "browser_type".
 */
type BrowserType = 'desktop' | 'mobile' | 'xr' | 'server'
/**
 * 浏览器内核。
 * 用于 `definition` "browser_engine".
 */
type BrowserEngine = 'Blink' | 'EdgeHTML' | 'Gecko' | 'Presto' | 'Trident' | 'WebKit' | 'V8'
/**
 * 浏览器状态
 * via the `definition` "browser_status".
 */
type BrowserStatus
  = | 'retired' // 已不再支持
    | 'deprecated' // 已废弃
    | 'current' // 当前正式支持
    | 'beta' // 测试中的新版本
    | 'nightly' // 开发中的新版本
    | 'esr' // 维护中的旧版本
    | 'planned' // 计划支持

/**
 * 浏览器状态信息
 * 用于 `definition` "browser_statement".
 */
export interface BrowserStatement {
  /**
   * 浏览器名称 (e.g. Firefox, Firefox Android, Chrome, etc.).
   */
  name: string
  /**
   * 浏览器所属平台类型 (e.g. desktop, mobile, XR, or server engine).
   */
  type: BrowserType
  /**
   * 该浏览器所基于的上游浏览器 (e.g. Firefox Android is derived from Firefox, Edge is derived from Chrome).
   */
  upstream?: BrowserName
  /**
   * 浏览器预览通道的名称 (e.g. 'Nightly' for Firefox or 'TP' for Safari).
   */
  preview_name?: string
  /**
   * 可更改功能标志的页面URL (e.g. 'about:config' for Firefox or 'chrome://flags' for Chrome).
   */
  pref_url?: string
  /**
   * 浏览器是否支持用户可切换的、用于启用或禁用功能的标志。
   */
  accepts_flags: boolean
  /**
   * 浏览器是否支持扩展功能。
   */
  accepts_webextensions: boolean
  /**
   * 该浏览器的已知版本。
   */
  releases: { [version: string]: ReleaseStatement }
}

/**
 *
 * 用于 `definition` "release_statement".
 */
export interface ReleaseStatement {
  /**
   * 此版本发布日期，格式为`YYYY-MM-DD`。
   */
  release_date?: string
  /**
   * 指向特定版本发布说明或更新日志的链接。
   */
  release_notes?: string
  /**
   * 指示此版本处于生命周期中哪个阶段的属性 (e.g. current, retired, beta, nightly).
   */
  status: BrowserStatus
  /**
   * 浏览器内核
   */
  engine?: BrowserEngine
  /**
   * 浏览器内核版本
   */
  engine_version?: string
}

/**
 * 用于 `patternProperty` "^(?!__compat)(?!webextensions)[a-zA-Z_0-9-$@]*$".
 *
 * 用于 `definition` "identifier".
 */
export type Identifier = { [key: string]: Identifier } & { __compat?: CompatStatement }
/**
 * 各浏览器支持情况的数据，包含每个浏览器标识符对应的`support_statement`对象，
 * 其中记录了版本信息、前缀或替代名称以及相关备注。
 */
export type SupportBlock = Partial<Record<BrowserName, SupportStatement>>
/**
 * 用于 `definition` "support_statement".
 */
export type SupportStatement
  = | SimpleSupportStatement
    | [SimpleSupportStatement, SimpleSupportStatement, ...SimpleSupportStatement[]]
    | 'mirror'

/**
 * 特性的兼容信息
 *
 * 用于 `patternProperty` "^__compat$".
 *
 * 用于 `definition` "compat_statement".
 */
export interface CompatStatement {
  /**
   * 包含该功能可读性描述的字符串。
   */
  description?: string
  /**
   * 指向记录该功能的MDN参考页面的URL。
   */
  mdn_url?: string
  /**
   * 一个可选的URL或URL数组，每个URL指向定义此功能的具体规范部分。
   */
  spec_url?: string | [string, string, ...string[]]
  /**
   * 一个可选的字符串数组，允许为功能分配标签。
   *
   * @minItems 1
   */
  tags?: [string, ...string[]]

  support: SupportBlock
  status?: StatusBlock
}
/**
 * 一个包含有关该功能稳定性信息的对象。
 */
export interface StatusBlock {
  /**
   * 一个布尔值，用于指示此功能的总体稳定性。
   *
   * - 如果该功能最近在一种浏览器引擎中实现，则此值为真。
   * - 如果该功能在多种浏览器引擎中实现，或者在任何一种浏览器引擎中实现已超过两年，则此值为假。
   */
  experimental: boolean
  /**
   * 一个布尔值，指示该特性是否属于活跃规范或规范流程的一部分。
   */
  standard_track: boolean
  /**
   * 一个布尔值，表示该功能是否不再推荐使用。未来可能会被移除，或仅出于兼容性目的而保留。请避免使用此功能。
   */
  deprecated: boolean
}

/**
 * 用于 `definition` "compat_statement"
 */
export interface SimpleSupportStatement {
  /**
   * 一个字符串（表示哪个浏览器版本添加了此功能），或者值为 false（表示不支持该功能）。
   */
  version_added: VersionValue
  /**
   * 一个字符串，表示移除该功能的浏览器版本。
   */
  version_removed?: string
  /**
   * 一个字符串，表示支持此功能的最后一个浏览器版本。此为自动生成。
   */
  version_last?: string
  /**
   * 添加到子功能名称的前缀（默认为空字符串）。如果适用，必须包含前导和尾随的“-”。
   */
  prefix?: string
  /**
   * 该功能的替代名称，适用于功能以完全不同的名称实现而不仅仅是添加前缀的情况。
   */
  alternative_name?: string
  /**
   * 一个可选的对象数组，用于描述必须为此浏览器配置以支持此功能的标志。
   *
   * @minItems 1
   */
  flags?: [FlagStatement, ...FlagStatement[]]
  /**
   * 实现该功能的源代码修订版本的可选变更集/提交URL，或关联浏览器中跟踪该实现过程的缺陷报告URL。
   */
  impl_url?: string | [string, string, ...string[]]
  /**
   * 一个布尔值，用于指示子功能的实现是否以可能导致兼容性问题的方式偏离了规范。
   * - 默认值为false（预计不会出现互操作性问题）。
   * - 如果设置为true，建议添加注释说明其与标准的不同之处（例如，它实现了旧版本的标准）。
   */
  partial_implementation?: true
  /**
   * 包含附加信息的字符串或字符串数组。
   */
  notes?: string | [string, string, ...string[]]
}

/**
 *
 * 用于 `definition` "flag_statement".
 */
export interface FlagStatement {
  /**
   * 指示标志类型的枚举。
   */
  type: 'preference' | 'runtime_flag'
  /**
   * 一个字符串，用于指定必须配置的标志或首选项的名称。
   */
  name: string
  /**
   * 一个字符串，指定了该功能生效所需设置的标志值。
   */
  value_to_set?: string
}

export interface MetaBlock {
  version: string
  timestamp: string
}

/**
 * BCD 数据结构
 */
export interface MDNCompatData {
  /**
   * 包含当前BCD信息的元数据，例如BCD版本。
   */
  __meta: MetaBlock

  /**
   * Contains data for each [Web API](https://developer.mozilla.org/docs/Web/API) interface.
   */
  api: Identifier

  /**
   * Contains data for each known and tracked browser/engine.
   */
  browsers: Browsers

  /**
   * Contains data for [CSS](https://developer.mozilla.org/docs/Web/CSS) properties, selectors, and at-rules.
   */
  css: Identifier

  /**
   * Contains data for [HTML](https://developer.mozilla.org/docs/Web/HTML) elements, attributes, and global attributes.
   */
  html: Identifier

  /**
   * Contains data for [HTTP](https://developer.mozilla.org/docs/Web/HTTP) headers, statuses, and methods.
   */
  http: Identifier

  /**
   * Contains data for [JavaScript](https://developer.mozilla.org/docs/Web/JavaScript) built-in Objects, statement, operators, and other ECMAScript language features.
   */
  javascript: Identifier

  /**
   * Contains data for various manifests, such as the [Web Application Manifest](https://developer.mozilla.org/docs/Web/Progressive_web_apps/manifest).
   */
  manifests: Identifier

  /**
   * Contains data for [MathML](https://developer.mozilla.org/docs/Web/MathML) elements, attributes, and global attributes.
   */
  mathml: Identifier

  /**
   * Contains data for [Media types](https://developer.mozilla.org/docs/Web/HTTP/Guides/MIME_types).
   */
  mediatypes: Identifier

  /**
   * Contains data for [SVG](https://developer.mozilla.org/docs/Web/SVG) elements, attributes, and global attributes.
   */
  svg: Identifier

  /**
   * Contains data for [WebAssembly](https://developer.mozilla.org/docs/WebAssembly) features.
   */
  webassembly: Identifier

  /**
   * Contains data for [WebDriver](https://developer.mozilla.org/docs/Web/WebDriver) commands.
   */
  webdriver: Identifier

  /**
   * Contains data for [WebExtensions](https://developer.mozilla.org/Add-ons/WebExtensions) JavaScript APIs and manifest keys.
   */
  webextensions: Identifier
}
