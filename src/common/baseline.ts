export const baselineInfo: Record<
  'low' | 'high' | 'limit' | 'discouraged' | 'deprecated' | 'experimental',
  { title?: string, label?: string, description: string }
> = {
  low: {
    title: 'Baseline {date}',
    label: 'Newly available',
    description: 'Since {date}, this feature works across the latest devices and browser versions. This feature might not work in older devices or browsers.',
  },
  high: {
    title: 'Baseline',
    label: 'Widely available',
    description: 'This feature is well established and works across many devices and browser versions. It’s been available across browsers since {date}.',
  },
  limit: {
    label: 'Limited availability',
    description: 'This feature is not Baseline because it does not work in some of the most widely-used browsers.',
  },
  discouraged: {
    title: 'Discouraged',
    description: 'This feature may be a candidate for removal from web standards or browsers.',
  },
  deprecated: {
    title: 'Deprecated',
    description: 'This feature is no longer recommended.',
  },
  experimental: {
    title: 'Experimental',
    description: 'This is an experimental technology.',
  },
}

export const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
