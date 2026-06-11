import { CalendarPlus, FileSpreadsheet, Search, Upload, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toIsoDate, formatDisplayDate } from '../utils/dates'
import { parseVolunteerCsv } from '../utils/csvImport'
import {
  getDepartmentLabel,
  getEventTitle,
  getVolunteerName,
  normalizeLabel,
} from '../utils/labels'

export function EventCreation({ volunteers, departments, events, onCreateEvent }) {
  const { i18n, t } = useTranslation()
  const [form, setForm] = useState({
    title: '',
    date: toIsoDate(new Date()),
    departmentId: departments[0]?.id ?? '',
    managerName: '',
    roleText: '',
  })
  const fileInputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [uploadedVolunteers, setUploadedVolunteers] = useState([])
  const [status, setStatus] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')

  const selectedVolunteers = useMemo(
    () => selectedIds.map((id) => volunteers.find((volunteer) => volunteer.id === id)).filter(Boolean),
    [selectedIds, volunteers],
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

  const handleParticipantCsv = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const parsedVolunteers = await parseVolunteerCsv(file)
      setUploadedVolunteers(parsedVolunteers)
      setUploadStatus(t('events.csvReady', { count: parsedVolunteers.length }))
    } catch {
      setUploadStatus(t('events.csvIssue'))
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!selectedIds.length && !uploadedVolunteers.length) {
      setStatus(t('events.needsParticipants'))
      return
    }

    onCreateEvent({
      title: form.title.trim() || t('events.namePlaceholder'),
      titleKey: null,
      date: form.date,
      departmentId: form.departmentId,
      managerName: form.managerName.trim(),
      participantIds: selectedIds,
      participantImports: uploadedVolunteers,
      roleText: form.roleText,
    })

    setForm({
      title: '',
      date: toIsoDate(new Date()),
      departmentId: departments[0]?.id ?? '',
      managerName: '',
      roleText: '',
    })
    setSelectedIds([])
    setUploadedVolunteers([])
    setQuery('')
    setUploadStatus('')
    setStatus(t('events.createdSynced'))
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-md bg-blue-50 p-2 text-blue-700">
            <CalendarPlus className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-slate-950">{t('events.createTitle')}</h2>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            {t('events.nameLabel')}
            <input
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
              placeholder={t('events.namePlaceholder')}
              className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              {t('events.dateLabel')}
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateForm('date', event.target.value)}
                className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              {t('events.departmentLabel')}
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
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            {t('events.managerLabel')}
            <input
              value={form.managerName}
              onChange={(event) => updateForm('managerName', event.target.value)}
              placeholder={t('events.managerPlaceholder')}
              className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
            />
          </label>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">
              {t('events.volunteersLabel')}
            </label>
            <div className="relative">
              <div className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
                <Search className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('events.volunteerSearch')}
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
                      <span className="text-slate-500">{volunteer.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {t('events.participantCsvTitle')}
                    </p>
                    <p className="text-xs text-slate-500">{t('events.participantCsvHint')}</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleParticipantCsv}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-line transition hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span>{t('events.uploadParticipantCsv')}</span>
                </button>
              </div>

              {uploadStatus && (
                <p className="mt-2 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-700">
                  {uploadStatus}
                </p>
              )}

              {!!uploadedVolunteers.length && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {uploadedVolunteers.slice(0, 12).map((volunteer) => (
                    <span
                      key={volunteer.id}
                      className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-line"
                    >
                      {getVolunteerName(volunteer)}
                      {volunteer.roleName ? ` · ${volunteer.roleName}` : ''}
                    </span>
                  ))}
                  {uploadedVolunteers.length > 12 && (
                    <span className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-line">
                      {t('events.moreImported', { count: uploadedVolunteers.length - 12 })}
                    </span>
                  )}
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
            {t('events.roleTextLabel')}
            <textarea
              value={form.roleText}
              onChange={(event) => updateForm('roleText', event.target.value)}
              placeholder={t('events.roleTextPlaceholder')}
              rows={3}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {t('events.selected', {
                count: selectedIds.length + uploadedVolunteers.length,
              })}
            </p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              <span>{t('actions.create')}</span>
            </button>
          </div>
        </form>

        {status && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {status}
          </p>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-950">{t('events.listTitle')}</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {events.length ? (
            events.map((event) => (
              <div key={event.id} className="grid gap-2 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium text-slate-950">{getEventTitle(event, t)}</p>
                  <span className="text-sm text-slate-500">
                    {formatDisplayDate(event.date, i18n.language)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1">
                    {t('events.participants', { count: event.participantIds.length })}
                  </span>
                  {event.managerName && (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1">
                      {t('events.managerPill', { manager: event.managerName })}
                    </span>
                  )}
                  {!!event.importedParticipantCount && (
                    <span className="rounded-md bg-teal-50 px-2.5 py-1 text-teal-700">
                      {t('events.importedPill', {
                        count: event.importedParticipantCount,
                      })}
                    </span>
                  )}
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-blue-700">
                    {getDepartmentLabel(
                      departments.find((department) => department.id === event.departmentId),
                      t,
                    )}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-slate-500">{t('events.recentEmpty')}</p>
          )}
        </div>
      </section>
    </div>
  )
}
