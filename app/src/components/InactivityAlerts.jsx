import clsx from 'clsx'
import { AlertTriangle, Check } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getInactiveVolunteers } from '../utils/analytics'
import { formatDisplayDate } from '../utils/dates'
import { getDepartmentLabel, getVolunteerName } from '../utils/labels'

const TIMEFRAME_KEYS = ['monthly', 'quarterly', 'biannual', 'yearly']

export function InactivityAlerts({
  volunteers,
  departments,
  events,
  timeframe,
  onTimeframeChange,
  compact = false,
}) {
  const { i18n, t } = useTranslation()
  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  )
  const inactiveVolunteers = useMemo(
    () => getInactiveVolunteers(volunteers, events, timeframe),
    [volunteers, events, timeframe],
  )
  const visibleVolunteers = compact ? inactiveVolunteers.slice(0, 5) : inactiveVolunteers
  const hasAlerts = inactiveVolunteers.length > 0

  return (
    <section
      className={clsx(
        'rounded-md border p-4 shadow-soft',
        hasAlerts
          ? 'border-amber-200 bg-amber-50/80'
          : 'border-teal-200 bg-teal-50/80',
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'rounded-md p-2',
              hasAlerts ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700',
            )}
          >
            {hasAlerts ? (
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Check className="h-5 w-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{t('alerts.title')}</h2>
            <p className="text-sm text-slate-600">
              {hasAlerts
                ? t('alerts.count', { count: inactiveVolunteers.length })
                : t('alerts.clear')}
            </p>
          </div>
        </div>

        {onTimeframeChange && (
          <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/70 bg-white/80 px-3 text-sm text-slate-600 shadow-line">
            <span className="sr-only">{t('timeframes.label')}</span>
            <select
              value={timeframe}
              onChange={(event) => onTimeframeChange(event.target.value)}
              className="bg-transparent text-slate-800 outline-none"
            >
              {TIMEFRAME_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`timeframes.${key}`)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {hasAlerts && (
        <div className="mt-4 grid gap-2">
          {visibleVolunteers.map((volunteer) => {
            const department = departmentById.get(volunteer.departmentId)
            const lastSeen = volunteer.lastParticipationDate
              ? t('alerts.lastSeen', {
                  date: formatDisplayDate(volunteer.lastParticipationDate, i18n.language),
                })
              : t('alerts.never')

            return (
              <div
                key={volunteer.id}
                className="flex flex-col gap-2 rounded-md border border-amber-200 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-950">{getVolunteerName(volunteer)}</p>
                  <p className="text-sm text-slate-600">
                    {getDepartmentLabel(department, t)} · {lastSeen}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  {t('alerts.inactiveFor', { timeframe: t(`timeframes.${timeframe}`) })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
