import { Building2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getWindowEvents } from '../utils/analytics'
import { getDepartmentLabel } from '../utils/labels'

export function DepartmentManager({ departments, volunteers, events, onAddDepartment }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')

  const activityByDepartment = useMemo(() => {
    const counts = new Map(departments.map((department) => [department.id, 0]))
    getWindowEvents(events, 'yearly').forEach((event) => {
      event.participantIds.forEach((volunteerId) => {
        const volunteer = volunteers.find((item) => item.id === volunteerId)
        if (!volunteer) return
        counts.set(volunteer.departmentId, (counts.get(volunteer.departmentId) ?? 0) + 1)
      })
    })
    return counts
  }, [departments, events, volunteers])

  const handleSubmit = (event) => {
    event.preventDefault()
    const departmentId = onAddDepartment(name)
    if (departmentId) setName('')
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-blue-50 p-2 text-blue-700">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-slate-950">{t('departments.title')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="department-name">
            {t('departments.addLabel')}
          </label>
          <input
            id="department-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('departments.namePlaceholder')}
            className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t('actions.add')}</span>
          </button>
        </form>
      </div>

      <div className="divide-y divide-slate-100">
        {departments.map((department) => {
          const members = volunteers.filter(
            (volunteer) => volunteer.departmentId === department.id,
          ).length

          return (
            <div
              key={department.id}
              className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: department.accent }}
                  aria-hidden="true"
                />
                <p className="font-medium text-slate-950">{getDepartmentLabel(department, t)}</p>
              </div>
              <p className="text-sm text-slate-600">
                {t('departments.members', { count: members })}
              </p>
              <p className="text-sm text-slate-600">
                {t('departments.activity', {
                  count: activityByDepartment.get(department.id) ?? 0,
                })}
              </p>
              <span className="inline-flex w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {department.isDefault
                  ? t('departments.defaultBadge')
                  : t('departments.customBadge')}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
