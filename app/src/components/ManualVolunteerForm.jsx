import { Plus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toIsoDate } from '../utils/dates'
import { getDepartmentLabel } from '../utils/labels'

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  departmentId: '',
  skills: '',
}

function splitFullName(value) {
  const parts = value.trim().split(/\s+/)
  return {
    firstName: parts.shift() ?? '',
    lastName: parts.join(' '),
  }
}

function parseSkills(value) {
  return value
    .split(/[;,|]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
}

export function ManualVolunteerForm({ departments, onAddVolunteer }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    departmentId: departments[0]?.id ?? '',
  })
  const [status, setStatus] = useState(null)

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nameParts = form.lastName ? form : splitFullName(form.firstName)
    const firstName = nameParts.firstName.trim()
    const lastName = (form.lastName || nameParts.lastName).trim()

    if (!firstName) {
      setStatus({ tone: 'amber', message: t('volunteers.nameRequired') })
      return
    }

    const outcome = onAddVolunteer({
      firstName,
      lastName,
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      departmentId: form.departmentId || departments[0]?.id,
      skills: parseSkills(form.skills),
      joinedAt: toIsoDate(new Date()),
    })

    setStatus({
      tone: 'teal',
      message:
        outcome === 'updated'
          ? t('volunteers.volunteerUpdated')
          : t('volunteers.volunteerAdded'),
    })
    setForm({ ...EMPTY_FORM, departmentId: departments[0]?.id ?? '' })
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-md bg-teal-50 p-2 text-teal-700">
          <UserPlus className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-slate-950">
          {t('volunteers.manualTitle')}
        </h2>
      </div>

      <form className="grid gap-3 lg:grid-cols-6" onSubmit={handleSubmit}>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700 lg:col-span-2">
          {t('volunteers.firstName')}
          <input
            value={form.firstName}
            onChange={(event) => updateForm('firstName', event.target.value)}
            placeholder={t('volunteers.fullNamePlaceholder')}
            className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 lg:col-span-2">
          {t('volunteers.lastName')}
          <input
            value={form.lastName}
            onChange={(event) => updateForm('lastName', event.target.value)}
            className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 lg:col-span-2">
          {t('volunteers.department')}
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

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 lg:col-span-2">
          {t('volunteers.email')}
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateForm('email', event.target.value)}
            className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 lg:col-span-2">
          {t('volunteers.phone')}
          <input
            value={form.phone}
            onChange={(event) => updateForm('phone', event.target.value)}
            className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 lg:col-span-2">
          {t('volunteers.city')}
          <input
            value={form.city}
            onChange={(event) => updateForm('city', event.target.value)}
            className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700 lg:col-span-4">
          {t('volunteers.skills')}
          <input
            value={form.skills}
            onChange={(event) => updateForm('skills', event.target.value)}
            placeholder={t('volunteers.skillsPlaceholder')}
            className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
          />
        </label>

        <div className="flex items-end lg:col-span-2">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t('volunteers.addVolunteer')}</span>
          </button>
        </div>
      </form>

      {status && (
        <p
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            status.tone === 'teal'
              ? 'bg-teal-50 text-teal-700'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          {status.message}
        </p>
      )}
    </section>
  )
}
