# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is an Astro SSR project that generates static pages for embedding browser compatibility data from [caniuse.com](https://caniuse.com/) and [MDN browser-compat-data](https://github.com/mdn/browser-compat-data). Each feature gets a pre-rendered static page (no runtime data fetching).

## Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Build: runs astro check + astro build
pnpm lint       # Run ESLint
pnpm gendata    # Regenerate data from scripts/datagen.ts
```

## Architecture

### Data Flow

1. Raw data from `@mdn/browser-compat-data` and `caniuse-db` is processed via `getFeaturesList()` in `src/services/get-feature-list.ts`
2. `bcd2FeatureList()` (`src/services/bcd/index.ts`) converts MDN BCD to FeatureData
3. `ciu2FeatureList()` (`src/services/ciu/index.ts`) converts caniuse data to FeatureData
4. Static pages generated via `getStaticPaths()` in `src/pages/[feature].astro`

### Key Directories

- `src/pages/` - Astro pages. `[feature].astro` generates individual feature pages, `features.json.ts` provides the API
- `src/services/bcd/` - MDN Browser Compatibility Data processing (flatten, normalize, supports calculation)
- `src/services/ciu/` - Can I Use data processing
- `src/scripts/` - Client-side JS for embed functionality (`embed.ts`, `feature.ts`, `shared.ts`)
- `src/components/` - Astro components for feature pages
- `src/common/data.ts` - Local cached data for dev mode

### Feature Sources

Features are identified by source:

- **caniuse**: IDs like `css-grid` (no prefix)
- **mdn**: IDs like `mdn-css_properties_grid` (prefixed with `mdn-`)

### Embed Script

The `embed.js` is not a static file - it's generated at build time via a custom Astro integration in `astro.config.mjs` that transforms `src/scripts/embed.ts` using esbuild and serves it at `/embed.js`.

### Caching

- In dev mode, data is cached to `data/cached.json` with 3 hour max age
- In production, data is fetched fresh on each build
