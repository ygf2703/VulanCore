export const FALLBACK_THEME_COLORS = ['#2563eb', '#facc15', '#ffffff', '#0f172a', '#94a3b8']

export function normalizeHexColor(value) {
  const color = String(value ?? '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color.toLowerCase()
  if (/^[0-9a-fA-F]{6}$/.test(color)) return `#${color.toLowerCase()}`
  return null
}

export function getSafeThemeColors(colors) {
  const safeColors = Array.isArray(colors)
    ? colors.map(normalizeHexColor).filter(Boolean)
    : []

  return [...safeColors, ...FALLBACK_THEME_COLORS].slice(0, 5)
}
