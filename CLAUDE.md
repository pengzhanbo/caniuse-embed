# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is an Astro static site (no SSR adapter, all pages prerendered) that generates static pages for embedding browser compatibility data from [caniuse.com](https://caniuse.com/), [MDN browser-compat-data](https://github.com/mdn/browser-compat-data) and [web-features](https://github.com/web-platform-dx/web-features). Each feature gets a pre-rendered static page (no runtime data fetching).

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Build: runs astro check + astro build
pnpm check      # Type check only (astro check)
pnpm test       # Unit tests (vitest)
pnpm check:data # Data sanity assertions (duplicate ids, contradictory states, baseline coverage)
pnpm preview    # Preview production build locally
pnpm lint       # Run ESLint
pnpm gendata    # Regenerate data/cached.json from scripts/datagen.ts
```

## Architecture

### Data Flow

1. Raw data from `@mdn/browser-compat-data`, `caniuse-db` and `web-features` is processed via `getFeaturesList()` in `src/services/get-feature-list.ts`
2. `buildFeatureData()` (`src/services/build-feature-data.ts`) is the single entry point that converts all three sources (also used by `scripts/datagen.ts`)
3. `bcd2FeatureList()` (`src/services/bcd/index.ts`) converts MDN BCD to FeatureData
4. `ciu2FeatureList()` (`src/services/ciu/index.ts`) converts caniuse data to FeatureData
5. `ensureUniqueFeatureIds()` guarantees unique ids before pages are generated
6. Static pages generated via `getStaticPaths()` in `src/pages/[feature].astro`

### Key Directories

- `src/pages/` - Astro pages. `[feature].astro` generates individual feature pages, `features.json.ts` provides the API
- `src/services/bcd/` - MDN Browser Compatibility Data processing (flatten, normalize, supports calculation)
- `src/services/ciu/` - Can I Use data processing
- `src/services/periods.ts` - shared "past 5 / current / future 3" period calculation used by both sources
- `src/services/data-source.ts` - resolves the latest published version of each dataset via jsDelivr (`CIU_*_VERSION` env vars pin a version for reproducible builds)
- `src/scripts/` - Client-side JS for embed functionality (`embed.ts`, `feature.ts`, `shared.ts`)
- `src/components/` - Astro components for feature pages
- `src/common/data.ts` - Local node_modules data for dev mode
- `tests/` - Vitest unit tests for pure functions (version comparison, support status, ids, markdown)
- `scripts/check-data.ts` - offline data sanity assertions against the locally installed datasets

### Feature Sources

Features are identified by source:

- **caniuse**: IDs like `css-grid` (no prefix)
- **mdn**: IDs like `mdn-css_properties_grid` (prefixed with `mdn-`)

### Embed Script

`embed.js` is not a static file - it is bundled from `src/scripts/embed.ts` with rolldown by a custom Astro integration in `astro.config.ts`:

- dev: served by a middleware at `/embed.js`
- build: written to `dist/embed.js` in the `astro:build:done` hook (only once)

### Caching (dev only)

- Data is cached to `data/cached.json`
- The cache is invalidated when: the file is older than 3 hours, or the hash of `src/services/**/*.ts` changes
- Production builds never use the cache: they resolve the **latest published version** of each
  dataset and fetch it from jsDelivr, so scheduled deployments always ship current data
- `pnpm gendata` uses the same latest-version resolution as production

## Conventions

- Never trust upstream HTML: `src/utils/markdown.ts` converts a small allowlist of tags (`<code>`, `<a href="http(s)">`) into markdown and renders with `html: false`
- Support status must be computed from the **first** support statement that covers a version, never by merging matches
- `compareVersion` handles non-numeric versions (`TP` / `preview` / `all`); do not parse them with `Number.parseInt`
