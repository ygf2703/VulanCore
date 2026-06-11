import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildActivityMap } from '../utils/analytics'
import { formatDisplayDate } from '../utils/dates'
import { getDepartmentLabel, getVolunteerName, normalizeLabel } from '../utils/labels'

const SORT_COLUMNS = [
  { key: 'name', labelKey: 'volunteers.name' },
  { key: 'email', labelKey: 'volunteers.email' },
  { key: 'phone', labelKey: 'volunteers.phone' },
  { key: 'department', labelKey: 'volunteers.department' },
  { key: 'skills', labelKey: 'volunteers.skills' },
  { key: 'lastParticipation', labelKey: 'volunteers.lastParticipation' },
]

function compareValues(first, second, language) {
  return String(first ?? '').localeCompare(String(second ?? ''), language, {
    numeric: true,
    sensitivity: 'base',
  })
}

export function VolunteersTable({
  volunteers,
  departments,
  events,
  onDepartmentChange,
}) {
  const { i18n, t } = useTranslation()
  const [query, setQuery] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  )
  const activityMap = useMemo(() => buildActivityMap(volunteers, events), [volunteers, events])

  const visibleVolunteers = useMemo(() => {
    const normalizedQuery = normalizeLabel(query)
    const filteredVolunteers = normalizedQuery
      ? volunteers.filter((volunteer) => {
          const department = departmentById.get(volunteer.departmentId)
          const haystack = normalizeLabel(
            [
              getVolunteerName(volunteer),
              volunteer.email,
              volunteer.phone,
              volunteer.city,
              getDepartmentLabel(department, t),
            ].join(' '),
          )

          return haystack.includes(normalizedQuery)
        })
      : volunteers

    const getSortValue = (volunteer) => {
      const activity = activityMap.get(volunteer.id)
      const department = departmentById.get(volunteer.departmentId)

      switch (sortConfig.key) {
        case 'email':
          return volunteer.email
        case 'phone':
          return volunteer.phone
        case 'department':
          return getDepartmentLabel(department, t)
        case 'skills':
          return volunteer.skills?.join(', ')
        case 'lastParticipation':
          return activity?.lastParticipationDate ?? ''
        case 'name':
        default:
          return getVolunteerName(volunteer)
      }
    }

    return filteredVolunteers
      .map((volunteer, index) => ({ volunteer, index }))
      .sort((first, second) => {
        const result = compareValues(
          getSortValue(first.volunteer),
          getSortValue(second.volunteer),
          i18n.language,
        )
        const stableResult = result || first.index - second.index
        return sortConfig.direction === 'asc' ? stableResult : -stableResult
      })
      .map(({ volunteer }) => volunteer)
  }, [activityMap, departmentById, i18n.language, query, sortConfig, t, volunteers])

  const updateSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const SortIcon = sortConfig.direction === 'asc' ? ArrowUp : ArrowDown

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-950">{t('volunteers.title')}</h2>
        <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
          <Search className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span className="sr-only">{t('actions.search')}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('volunteers.searchPlaceholder')}
            className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 sm:w-64"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {SORT_COLUMNS.map((column) => {
                const isActive = sortConfig.key === column.key
                const Icon = isActive ? SortIcon : ArrowUpDown

                return (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-start font-semibold"
                    aria-sort={
                      isActive
                        ? sortConfig.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => updateSort(column.key)}
                      className="inline-flex min-h-8 items-center gap-2 rounded-md px-1 text-start transition hover:text-slate-900"
                      aria-label={t('volunteers.sortBy', {
                        field: t(column.labelKey),
                      })}
                    >
                      <span>{t(column.labelKey)}</span>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleVolunteers.map((volunteer) => {
              const activity = activityMap.get(volunteer.id)

              return (
                <tr key={volunteer.id} className="bg-white hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {getVolunteerName(volunteer)}
                    <p className="text-xs font-normal text-slate-500">
                      {formatDisplayDate(volunteer.joinedAt, i18n.language)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{volunteer.email}</td>
                  <td className="px-4 py-3 text-slate-600">{volunteer.phone}</td>
                  <td className="px-4 py-3">
                    <select
                      value={volunteer.departmentId}
                      onChange={(event) =>
                        onDepartmentChange(volunteer.id, event.target.value)
                      }
                      className="min-h-10 rounded-md border border-slate-200 bg-white px-2 text-slate-800 outline-none focus:border-blue-300"
                    >
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {getDepartmentLabel(department, t)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {volunteer.skills?.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {activity?.lastParticipationDate
                      ? formatDisplayDate(activity.lastParticipationDate, i18n.language)
                      : t('volunteers.never')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!visibleVolunteers.length && (
        <p className="p-4 text-sm text-slate-500">{t('volunteers.none')}</p>
      )}
    </section>
  )
}
