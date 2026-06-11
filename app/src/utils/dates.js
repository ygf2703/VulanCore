export const TIMEFRAME_MONTHS = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  yearly: 12,
}

export function toIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

export function monthsAgo(months, day = 15) {
  const now = new Date()
  const safeDay = Math.min(day, 28)
  return toIsoDate(new Date(now.getFullYear(), now.getMonth() - months, safeDay))
}

export function parseDateValue(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getWindowStart(timeframe, referenceDate = new Date()) {
  const months = TIMEFRAME_MONTHS[timeframe] ?? TIMEFRAME_MONTHS.quarterly
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - months,
    referenceDate.getDate(),
  )
}

export function formatDisplayDate(value, language) {
  const date = parseDateValue(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function createMonthBuckets(timeframe, language) {
  const months = TIMEFRAME_MONTHS[timeframe] ?? TIMEFRAME_MONTHS.quarterly
  const locale = language === 'he' ? 'he-IL' : 'en-US'
  const formatter = new Intl.DateTimeFormat(locale, { month: 'short' })
  const now = new Date()

  return Array.from({ length: months }, (_, index) => {
    const offset = months - index - 1
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    return {
      key,
      label: formatter.format(date),
      participants: 0,
      events: 0,
    }
  })
}

export function getMonthKey(value) {
  const date = parseDateValue(value)
  if (!date) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
