import type { APIRoute } from 'astro'
import { getFeaturesList } from '../services/get-feature-list'

export const prerender = true

function toDate(value: string | number): string {
  const iso = typeof value === 'number' ? new Date(value).toISOString() : value
  return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : ''
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href || 'https://caniuse-embed.vercel.app/').replace(/\/+$/, '')
  const { featureList, bcdUpdated, ciuUpdated } = await getFeaturesList()

  const bcdDate = toDate(bcdUpdated)
  const ciuDate = toDate(ciuUpdated)

  const urls: string[] = [
    `<url><loc>${escapeXml(`${base}/`)}</loc></url>`,
    `<url><loc>${escapeXml(`${base}/zh-CN/`)}</loc></url>`,
  ]

  for (const feature of featureList) {
    const lastmod = feature.source === 'mdn' ? bcdDate : ciuDate
    const suffix = lastmod ? `<lastmod>${lastmod}</lastmod>` : ''
    const path = encodeURIComponent(feature.id)
    urls.push(`<url><loc>${escapeXml(`${base}/${path}/`)}</loc>${suffix}</url>`)
    urls.push(`<url><loc>${escapeXml(`${base}/${path}/baseline/`)}</loc>${suffix}</url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public,max-age=86400,s-maxage=86400',
    },
  })
}
