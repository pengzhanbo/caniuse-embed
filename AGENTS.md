# Repository Guidelines

Guidance for AI assistants working in this repo. It is a fully static Astro site that prerenders browser-compatibility pages and a JSON API from three upstream datasets, plus an embed script served to third-party pages.

## Project Overview

- Generates one static page per feature from caniuse, MDN browser-compat-data (BCD), and web-features Baseline data.
- Every route is prerendered (`export const prerender = true`); there is no SSR adapter and no runtime data fetching in pages.
- Deploys to Vercel. A weekly GitHub Actions job runs data checks and triggers a rebuild so upstream data stays current.
- Public surfaces:
  - `GET /{feature}` — full 10-browser support table.
  - `GET /{feature}/baseline` — compact Baseline card.
  - `GET /{feature}.json` — statically generated feature JSON with `status`.
  - `/features.json`, `/data-versions.json`, `/sitemap.xml`.
  - `/embed.js` — generated bundle for third-party embeds.

## Architecture & Data Flow

1. **Single data entry point.** `getFeaturesList()` (`src/services/get-feature-list.ts`) is a memoized singleton called by every data page/endpoint that needs feature data.
2. **Source selection.**
   - Dev (`import.meta.env.DEV`): use a valid `data/cached.json` (mtime < 3 h, `schema: 1`, transform hash match), otherwise installed packages via `src/common/data.ts`.
   - Production build: resolve the latest *published* npm versions through the jsDelivr API, fetch exact versioned files, and record them. If any remote fetch fails, fall back wholesale to installed `node_modules` and record local versions.
   - Optional pins: `CIU_BCD_VERSION`, `CIU_CANIUSE_VERSION`, `CIU_WEBFEATURES_VERSION`.
3. **Convert.** `buildFeatureData()` (`src/services/build-feature-data.ts`) validates upstream shapes, runs `bcd2FeatureList()` and `ciu2FeatureList()` generators, then `ensureUniqueFeatureIds()`.
4. **Baseline is separate.** `getBaselineStatusData()` (`src/services/baseline.ts`) flattens web-features into `Record<string, FeatureStatus>`. `FeatureData.status` is *not* populated by conversion; pages attach it:
   ```ts
   baseline[formatId(data.source === 'mdn' ? data.paths : data.id)]
   ```
5. **Render.** Pages and API routes consume `{ featureList, baseline, bcdUpdated, ciuUpdated, versions }`. `scripts/datagen.ts` and `scripts/check-data.ts` reuse the same `buildFeatureData()` path.
6. **Embed.** `src/scripts/embed.ts` is bundled by a custom Astro + rolldown integration (`astro.config.ts`): dev middleware serves `/embed.js`; `astro:build:done` writes `dist/embed.js` once. It injects iframes to `/{feature}` or `/{feature}/baseline` and uses a `postMessage` height protocol.

Do not create a second conversion pipeline. Data-shaping changes belong in `src/services/**` and must keep `scripts/datagen.ts`, pages, and tests consistent.

### Dev cache behavior

- `data/cached.json` is dev-only, gitignored, and written atomically by dev or `pnpm gendata`.
- Freshness uses **file mtime**, not `cachedAt`; validity also requires `schema: 1` and a SHA-1 transform hash.
- The hash covers all `src/services/**/*.ts` plus `normalize-version.ts`, `compare-version.ts`, `format-id.ts`, and `common/constants.ts` (`src/services/cache-version.ts`). If you move data-shaping logic, update that dependency list; if the bundle shape changes, bump `CACHE_SCHEMA` in **both** `get-feature-list.ts` and `scripts/datagen.ts`.
- Production never reads this file. Do not rely on it for remote-data freshness.

## Key Directories

| Path | Purpose |
| --- | --- |
| `src/services/` | Data pipeline: source resolution, conversion, periods, Baseline, ID de-duplication, caches. Node-only code. |
| `src/services/bcd/` | MDN BCD flattening, title formatting, mirror resolution, usage stats, first-match support logic. |
| `src/services/ciu/` | caniuse conversion and status-string normalization. |
| `src/scripts/` | Browser bundles: `embed.ts` (host page), `feature.ts`, `baseline.ts`, `home.ts`, `shared.ts`. |
| `src/pages/` | All routes; every one is prerendered. Feature routes are built from `getFeaturesList()`. |
| `src/components/`, `src/layouts/` | Astro UI; plain CSS lives in `src/styles/` (no Tailwind). |
| `src/utils/` | Pure helpers: version comparison/normalization, markdown safety, IDs, URLs, fetch retry, atomic writes. |
| `src/common/` | Shared constants (`BROWSERS`, periods, status tokens, site origin) and local dataset imports. |
| `src/i18n/` | `Locale` contract plus `en-US` / `zh-CN` homepage copy. |
| `scripts/` | `datagen.ts` (regenerate dev cache) and `check-data.ts` (data sanity checks). |
| `tests/` | Vitest unit tests for pure functions only. |
| `data/`, `dist/`, `.astro/`, `report/` | Generated/ignored. Never commit. |

## Development Commands

```bash
pnpm install                 # install (CI uses --frozen-lockfile)
pnpm dev                     # Astro dev server; /embed.js served by middleware
pnpm build                   # astro check && astro build
pnpm check                   # astro check only (type check)
pnpm lint                    # eslint .
pnpm test                    # vitest run
pnpm test:watch              # vitest
pnpm check:data              # sanity-check installed datasets
pnpm check:data --remote     # sanity-check latest upstream datasets
pnpm gendata                 # regenerate data/cached.json from latest remote data
pnpm preview                 # serve production build
```

Single test file: `pnpm exec vitest run tests/version.test.ts`. Filter by name: `pnpm exec vitest run -t "compareVersion"`.

Guidance:

- TypeScript/Astro change → `pnpm check` (cheapest coverage; `pnpm build` also runs it).
- Behavior change in a pure function → its test file; run `pnpm test` only if the blast radius is unclear.
- Upstream-data shape/normalization change → `pnpm test` plus `pnpm check:data`, and `pnpm check:data --remote` when validating newest upstream data.
- UI/embed change → `pnpm dev` and verify the actual page/iframe; there are no browser tests.
- CI runs `pnpm test` + local `pnpm check:data`, and separately `pnpm lint` + `pnpm check`. **CI does not run `pnpm build`**, so a green PR does not prove the production build works.

Version-pinned reproduction:

```bash
CIU_BCD_VERSION=8.1.11 CIU_CANIUSE_VERSION=1.0.30001828 CIU_WEBFEATURES_VERSION=3.48.0 pnpm build
```

## Code Conventions & Common Patterns

### Style and modules

- ESM only (`"type": "module"`); relative imports, no path aliases.
- TypeScript `astro/tsconfigs/strictest` + `verbatimModuleSyntax`: use `import type` for types.
- 2-space indent, single quotes, no semicolons, trailing commas. No Prettier/Biome; ESLint (`@pengzhanbo/eslint-config-astro`) is the source of truth.
- `node:` prefix for built-ins (`node:fs/promises`, `node:crypto`, `node:process`).
- File names kebab-case; `.astro` components PascalCase; functions/variables camelCase.
- Source comments and test descriptions are Chinese. Keep that language for comments and prefixes for operational messages (`[caniuse-embed] ...`).

### Data correctness invariants

- **First covering support statement wins.** BCD support arrays are priority-ordered intervals; never union all matching statements (`src/services/bcd/caniuse-status.ts`).
- **Missing support is not always "unsupported."** No statements → `u` (unknown); statements exist but none cover the version → `n`; `version_added: false` covers all versions as `n`.
- **caniuse strings are normalized, not additive:** strip `#n`, map `p` → `n`, remove `y` when combined with another status, and add `n` whenever `d` is present (`src/services/ciu/supports.ts`).
- **Never parse versions with `Number.parseInt`.** Use `normalizeVersion()` and `compareVersion()`. They handle ranges (`15.2-15.3`), comparators (`≤`, `>=`, trailing `+`), previews (`TP`, `preview`, `beta`, `nightly`, `alpha`, `dev`), and `all` (`src/utils/*version*.ts`).
- **Periods are groups, not raw versions.** Up to 5 past and 3 future groups; adjacent identical statuses merge and usage sums. Emit only real periods; `zipFeatureSupports()` pads missing browser cells at render time only (`src/services/periods.ts`, `zip-feature-supports.ts`).
- **Browser order is fixed.** `BROWSERS` has 10 entries and CSS grid columns depend on its order and length.
- **Baseline: missing ≠ false.** Missing web-features status → `unknown`; `baseline: false` → `limit`. Precedence: `discouraged` > `experimental` > `deprecated` > high/low/limit (`src/services/get-baseline-status.ts`). For `compat_features`, use the containing web-feature's `discouraged` data, not `features[compatKey]`.
- **IDs are URLs.** caniuse IDs have no prefix; MDN IDs are `mdn-` + `paths.join('_')`, lowercased, `@` → `-`. `ensureUniqueFeatureIds()` keeps the existing lowercase-path ID and appends `-2`, `-3`, … deterministically; it throws if duplicates remain.

### Security and upstream content

- Never render upstream HTML directly with `set:html`.
- Use `markdownRender()` for BCD/web-features title and description HTML. It allowlists only `<code>` and `<a href="http(s)">`, converts them to Markdown, and renders with `html: false`.
- Use `{ links: false }` for titles already inside an `<a>` to prevent nested links.
- Use `markdownToPlainText()` for `<title>`, meta tags, and selector labels.
- Use `safeHttpUrl()` before rendering any upstream URL.
- CSP is `script-src 'self'`. Keep scripts external; `public/theme-init.js` exists specifically to avoid inline scripts. Do not loosen `vercel.json` casually, and do not add a global `frame-ancestors` rule — feature pages must stay frameable for embeds.

### Caching, errors, async

- Remote fetch pattern: `fetchData()` uses 60 s timeout, 3 retries with exponential backoff, and `res.ok` validation.
- Recoverable upstream anomalies warn and degrade (mirror cycles, missing `current_version`, jsDelivr resolution failure). Structural mismatches throw with `[caniuse-embed] 上游数据结构异常: ...` so the failing dataset is obvious.
- Cache writes must stay atomic via `writeFileAtomic()`.
- Prefer `Promise.all` for the three independent source fetches.
- Avoid adding module-level caches without a reset path; `getFeaturesList()` clears stats/usage caches after building.

### Client and rendering patterns

- State lives in `data-*` attributes and the iframe URL hash/query (`feature`, `meta`, `past`, `future`, `theme`), not in a framework store.
- Embed height protocol: child posts `{ type: 'ciu-embed', payload: { feature, height, meta } }`; parent validates source window, origin, feature, and meta, and clamps height to 4000 px.
- `src/scripts/embed.ts` must remain a self-contained IIFE with no imports or code-splitting. Dev bundling is cached only by that entry file's mtime, and production uses `result.output[0]`.
- Keep `/embed.js` generated in `astro:build:done`, not `astro:build:setup` (the latter fires twice).
- Do not add `public/embed.js`; edit `src/scripts/embed.ts`.
- Theme is applied before first paint by `public/theme-init.js`; client scripts keep it in sync.

### Docs and i18n

- `README.md` and `README.zh-CN.md` should stay in sync.
- Homepage copy requires updating `src/i18n/types.ts` plus both locale files.
- If you change the public JSON shape, update the Data API section of both READMEs.

## Important Files

| Path | Why it matters |
| --- | --- |
| `astro.config.ts` | Static config, site origin, custom `ciu-embed-scripts` rolldown integration. |
| `src/services/get-feature-list.ts` | Data singleton, dev cache, remote/local source selection. |
| `src/services/build-feature-data.ts` | Only shared conversion entry; upstream shape assertions. |
| `src/services/data-source.ts` | jsDelivr version resolution, env pins, local version reporting. |
| `src/services/cache-version.ts` | Transform hash used to invalidate the dev cache. |
| `src/services/ensure-unique-ids.ts` | URL-safe unique feature IDs; final duplicate guard. |
| `src/services/bcd/caniuse-status.ts` | First-covering-statement support logic and stats cache. |
| `src/services/periods.ts` | Past/current/future grouping and merging. |
| `src/services/baseline.ts` | web-features → Baseline map, including discouraged compat keys. |
| `src/utils/markdown.ts` | Allowlisted upstream-HTML conversion and plain-text rendering. |
| `src/utils/compare-version.ts` | Version ordering for numeric, preview, and aggregate versions. |
| `src/common/constants.ts` | Browser order, period classes, status tokens, site origin. |
| `src/scripts/embed.ts` | Host-page embed behavior; source of `/embed.js`. |
| `src/pages/[feature].astro` | Main static page and Baseline lookup key. |
| `src/pages/[feature].json.ts` | Public per-feature API; CORS and cache headers. |
| `scripts/check-data.ts` | Data sanity gate used by CI and weekly deploys. |
| `vercel.json` | Security headers/CSP; `frame-ancestors` only on home pages. |

## Runtime/Tooling Preferences

- **Node** `>=22.23.4` (`package.json`); CI uses Node 24. Do not use APIs newer than Node 22.
- **pnpm** `12.23.0` via `packageManager`. Use pnpm only; never edit `pnpm-lock.yaml` by hand. Dependency overrides live in `pnpm-workspace.yaml`, not `package.json`.
- **Astro 7** static output, no adapter. Adding a runtime/server endpoint requires an explicit architecture change.
- **TypeScript 6** with `strictest`; `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax` are on.
- **ESLint 10** flat config with the Astro preset; no standalone formatter.
- **Vitest 5** with default config, node environment, globals off.
- **Vercel** hosts the build; `vercel.json` contains response headers only. `robots.txt`, canonical URLs, and sitemap point at the primary origin `https://caniuse-embed.vercel.app`; `caniuse.pengzhanbo.cn` is a documented mirror.
- **Secrets/env:** only `VERCEL_WEB_HOOK` is required (weekly deploy). No env vars are required for local development or tests.

## Testing & QA

- Tests are flat `tests/<subject>.test.ts`, import `{ describe, expect, it }` from `vitest`, and use local inline fixtures/factories. No setup files, mocks, snapshots, coverage config, jsdom, or browser tests.
- `tsconfig.json` does not include `tests/`, so `astro check` does **not** type-check specs; Vitest transpiles them.
- Unit coverage is intentionally narrow: version handling, markdown/XSS safety, IDs, Baseline status, caniuse stats/usage, mirror resolution, periods, title formatting, data-version normalization.
- Untested surfaces: `.astro` pages/components, `embed.js` runtime, client theme/height behavior, `resolveDataSources()` network paths, and `getFeaturesList()` caching. Verify these manually in a browser when changed.
- `pnpm check:data` calls the real `buildFeatureData()` against installed datasets and fails on:
  - duplicate feature IDs,
  - contradictory cells (`a+y`, `x+y`, `d` without `n`/`a`),
  - fewer discouraged Baseline entries than web-features,
  - unknown-feature ratio above 50%.
- `pnpm check:data --remote` runs the same checks against latest upstream data before the weekly deploy.
- New regression tests should target the pure function that broke, assert the consumer-visible behavior, and use Chinese descriptions matching the existing suite. Avoid tests for wiring or implementation details.

### CI summary

| Workflow | Trigger | Checks |
| --- | --- | --- |
| `lint.yaml` | push to `main`, PR | `pnpm lint`, `pnpm check` |
| `test.yaml` | push to `main`, PR | `pnpm test`, `pnpm check:data` |
| `auto-deploy.yaml` | Sundays 00:00 UTC, manual | `pnpm test`, `pnpm check:data --remote`, POST `VERCEL_WEB_HOOK` |
