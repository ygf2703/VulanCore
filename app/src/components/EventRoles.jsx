import { ClipboardList, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getDepartmentLabel,
  getEventRoleTitle,
  getEventTitle,
  getVolunteerName,
  normalizeLabel,
} from '../utils/labels'

export function EventRoles({
  volunteers,
  departments,
  events,
  eventRoles,
  onCreateRole,
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    eventId: events[0]?.id ?? '',
    title: '',
    departmentId: departments[0]?.id ?? '',
    requiredCount: 1,
    notes: '',
  })
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [status, setStatus] = useState('')

  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  )
  const departmentById = useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  )
  const volunteerById = useMemo(
    () => new Map(volunteers.map((volunteer) => [volunteer.id, volunteer])),
    [volunteers],
  )

  const selectedVolunteers = useMemo(
    () => selectedIds.map((id) => volunteerById.get(id)).filter(Boolean),
    [selectedIds, volunteerById],
  )

  const suggestions = useMemo(() => {
    const normalizedQuery = normalizeLabel(query)
    if (!normalizedQuery) return []

    return volunteers
      .filter((volunteer) => !selectedIds.includes(volunteer.id))
      .filter((volunteer) =>
        normalizeLabel([getVolunteerName(volunteer), volunteer.email, volunteer.phone].join(' ')).includes(
          normalizedQuery,
        ),
      )
      .slice(0, 6)
  }, [query, selectedIds, volunteers])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addVolunteer = (volunteerId) => {
    setSelectedIds((current) => [...current, volunteerId])
    setQuery('')
  }

  const removeVolunteer = (volunteerId) => {
    setSelectedIds((current) => current.filter((id) => id !== volunteerId))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.eventId || !form.title.trim()) {
      setStatus(t('roles.roleRequired'))
      return
    }

    onCreateRole({
      eventId: form.eventId,
      title: form.title.trim(),
      titleKey: null,
      departmentId: form.departmentId,
      requiredCount: Math.max(Number(form.requiredCount) || 1, 1),
      assignedVolunteerIds: selectedIds,
      notes: form.notes.trim(),
    })

    setStatus(t('roles.created'))
    setForm({
      eventId: events[0]?.id ?? '',
      title: '',
      departmentId: departments[0]?.id ?? '',
      requiredCount: 1,
      notes: '',
    })
    setSelectedIds([])
    setQuery('')
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-md bg-blue-50 p-2 text-blue-700">
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-slate-950">
            {t('roles.createTitle')}
          </h2>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            {t('roles.eventLabel')}
            <select
              value={form.eventId}
              onChange={(event) => updateForm('eventId', event.target.value)}
              className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {getEventTitle(event, t)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              {t('roles.roleName')}
              <input
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder={t('roles.rolePlaceholder')}
                className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              {t('roles.requiredCount')}
              <input
                type="number"
                min="1"
                value={form.requiredCount}
                onChange={(event) => updateForm('requiredCount', event.target.value)}
                className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            {t('roles.departmentLabel')}
            <select
              value={form.departmentId}
              onChange={(event) => updateForm('departmentId', event.target.value)}
              className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
            >
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {getDepartmentLabel(department, t)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              {t('roles.assignedVolunteers')}
            </label>
            <div className="relative">
              <div className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
                <Search className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('roles.volunteerSearch')}
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              {!!suggestions.length && (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft">
                  {suggestions.map((volunteer) => (
                    <button
                      key={volunteer.id}
                      type="button"
                      onClick={() => addVolunteer(volunteer.id)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">
                        {getVolunteerName(volunteer)}
                      </span>
                      <span className="text-slate-500">{volunteer.email || volunteer.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedVolunteers.map((volunteer) => (
                <span
                  key={volunteer.id}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1.5 text-sm font-medium text-blue-700"
                >
                  {getVolunteerName(volunteer)}
                  <button
                    type="button"
                    onClick={() => removeVolunteer(volunteer.id)}
                    aria-label={t('actions.remove')}
                    className="rounded-md p-0.5 hover:bg-blue-100"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            {t('roles.notes')}
            <textarea
              value={form.notes}
              onChange={(event) => updateForm('notes', event.target.value)}
              rows={3}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-300"
            />
          </label>

          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t('roles.createRole')}</span>
          </button>
        </form>

        {status && (
          <p className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-700">
            {status}
          </p>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-950">{t('roles.listTitle')}</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {eventRoles.length ? (
            eventRoles.map((role) => {
              const event = eventById.get(role.eventId)
              const department = departmentById.get(role.departmentId)
              const assignedCount = role.assignedVolunteerIds?.length ?? 0
              const requiredCount = Number(role.requiredCount || 0)
              const openCount = Math.max(requiredCount - assignedCount, 0)

              return (
                <div key={role.id} className="grid gap-3 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">
                        {getEventRoleTitle(role, t)}
                      </p>
                      <p className="text-sm text-slate-600">
                        {getEventTitle(event, t)} · {getDepartmentLabel(department, t)}
                      </p>
                    </div>
                    <span className="inline-flex w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {t('roles.coverage', {
                        assigned: assignedCount,
                        required: requiredCount,
                      })}
                    </span>
                  </div>

                  {!!openCount && (
                    <span className="inline-flex w-fit rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {t('roles.openSlots', { count: openCount })}
                    </span>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(role.assignedVolunteerIds ?? []).map((volunteerId) => {
                      const volunteer = volunteerById.get(volunteerId)
                      if (!volunteer) return null
                      return (
                        <span
                          key={volunteerId}
                          className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                        >
                          {getVolunteerName(volunteer)}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="p-4 text-sm text-slate-500">{t('roles.empty')}</p>
          )}
        </div>
      </section>
    </div>
  )
}
