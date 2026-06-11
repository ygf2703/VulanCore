import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CsvImportPanel } from './components/CsvImportPanel'
import { DataBackupPanel } from './components/DataBackupPanel'
import { Dashboard } from './components/Dashboard'
import { DepartmentManager } from './components/DepartmentManager'
import { EventCreation } from './components/EventCreation'
import { EventRoles } from './components/EventRoles'
import { Header } from './components/Header'
import { InactivityAlerts } from './components/InactivityAlerts'
import { ManualVolunteerForm } from './components/ManualVolunteerForm'
import { OrganizationSettings } from './components/OrganizationSettings'
import { PrivacyPolicy } from './components/PrivacyPolicy'
import { Sidebar } from './components/Sidebar'
import { VolunteersTable } from './components/VolunteersTable'
import { DEFAULT_DATA } from './data/defaultData'
import { DATA_SCHEMA_VERSION } from './data/schema'
import { useLocalStorage } from './hooks/useLocalStorage'
import { toIsoDate } from './utils/dates'
import { normalizeBackupPayload } from './utils/dataBackup'
import { createId } from './utils/id'
import { getVolunteerIdentityKey, normalizeLabel } from './utils/labels'
import { getSafeThemeColors } from './utils/theme'

const STORAGE_KEY = 'voluncore:data:v1'

const VIEW_KEYS = [
  'dashboard',
  'volunteers',
  'departments',
  'events',
  'roles',
  'alerts',
  'settings',
]
const DEPARTMENT_ACCENTS = ['#2563eb', '#0f766e', '#0284c7', '#d97706', '#475569']

function getCurrentRoutePath() {
  return window.location.pathname.replace(/\/+$/, '') || '/'
}

function dedupeIds(ids) {
  return [...new Set(ids.filter(Boolean))]
}

function splitRoleText(value) {
  return String(value ?? '')
    .split(/\r?\n|,/)
    .map((role) => role.trim())
    .filter(Boolean)
}

function mergeVolunteerData(existing, incoming) {
  const nextVolunteer = { ...existing }

  Object.entries(incoming).forEach(([key, value]) => {
    if (key === 'id') return
    if (Array.isArray(value)) {
      if (value.length) nextVolunteer[key] = value
      return
    }
    if (value !== undefined && value !== null && value !== '') {
      nextVolunteer[key] = value
    }
  })

  return nextVolunteer
}

function normalizeEvents(events) {
  return events.map((event) => ({
    durationHours: 2,
    ...event,
  }))
}

function App() {
  const { i18n, t } = useTranslation()
  const [data, setData] = useLocalStorage(STORAGE_KEY, DEFAULT_DATA)
  const [activeView, setActiveView] = useState('dashboard')
  const [timeframe, setTimeframe] = useState('quarterly')
  const [routePath, setRoutePath] = useState(getCurrentRoutePath)

  const isPrivacyRoute = routePath === '/privacy'
  const isRtl = isPrivacyRoute || i18n.language === 'he'

  useEffect(() => {
    document.documentElement.lang = isPrivacyRoute ? 'he' : i18n.language
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
  }, [i18n.language, isPrivacyRoute, isRtl])

  useEffect(() => {
    const syncRoute = () => setRoutePath(getCurrentRoutePath())
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  const navigateTo = useCallback((path) => {
    const nextPath = path || '/'
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }
    setRoutePath(getCurrentRoutePath())
  }, [])

  const safeData = useMemo(
    () => ({
      schemaVersion: DATA_SCHEMA_VERSION,
      settings: data?.settings ?? DEFAULT_DATA.settings,
      departments: data?.departments ?? DEFAULT_DATA.departments,
      volunteers: data?.volunteers ?? DEFAULT_DATA.volunteers,
      events: normalizeEvents(data?.events ?? DEFAULT_DATA.events),
      eventRoles: data?.eventRoles ?? DEFAULT_DATA.eventRoles,
    }),
    [data],
  )
  const themeColors = getSafeThemeColors(safeData.settings?.themeColors)
  const copyrightYear = new Date().getFullYear()

  const addDepartment = useCallback((name) => {
    const cleanName = name.trim()
    if (!cleanName) return null

    let departmentId = null
    setData((current) => {
      const departmentExists = current.departments.some(
        (department) => normalizeLabel(department.name) === normalizeLabel(cleanName),
      )

      if (departmentExists) {
        departmentId = current.departments.find(
          (department) => normalizeLabel(department.name) === normalizeLabel(cleanName),
        )?.id
        return current
      }

      departmentId = createId('dept')
      const accent = DEPARTMENT_ACCENTS[current.departments.length % DEPARTMENT_ACCENTS.length]
      return {
        ...current,
        departments: [
          ...current.departments,
          {
            id: departmentId,
            name: cleanName,
            nameKey: null,
            aliases: [cleanName],
            accent,
            isDefault: false,
            createdAt: new Date().toISOString(),
          },
        ],
      }
    })

    return departmentId
  }, [setData])

  const addVolunteer = useCallback((volunteer) => {
    let outcome = 'created'
    setData((current) => {
      const nextVolunteer = {
        id: createId('vol'),
        joinedAt: volunteer.joinedAt || toIsoDate(new Date()),
        createdAt: new Date().toISOString(),
        ...volunteer,
      }
      const identityKey = getVolunteerIdentityKey(nextVolunteer)
      const existingIndex = current.volunteers.findIndex(
        (item) => getVolunteerIdentityKey(item) === identityKey,
      )

      if (existingIndex >= 0) {
        outcome = 'updated'
        const nextVolunteers = [...current.volunteers]
        nextVolunteers[existingIndex] = {
          ...nextVolunteers[existingIndex],
          ...nextVolunteer,
          id: nextVolunteers[existingIndex].id,
          createdAt: nextVolunteers[existingIndex].createdAt ?? nextVolunteer.createdAt,
        }
        return { ...current, volunteers: nextVolunteers }
      }

      return {
        ...current,
        volunteers: [nextVolunteer, ...current.volunteers],
      }
    })

    return outcome
  }, [setData])

  const importVolunteers = useCallback((importedVolunteers) => {
    setData((current) => {
      const nextDepartments = [...current.departments]
      const departmentByAlias = new Map()

      nextDepartments.forEach((department) => {
        ;[department.name, ...(department.aliases ?? [])].forEach((alias) => {
          departmentByAlias.set(normalizeLabel(alias), department.id)
        })
      })

      const ensureDepartment = (departmentName) => {
        const fallbackDepartment = nextDepartments[0]?.id ?? 'management'
        if (!departmentName) return fallbackDepartment

        const normalized = normalizeLabel(departmentName)
        const existingId = departmentByAlias.get(normalized)
        if (existingId) return existingId

        const departmentId = createId('dept')
        const accent = DEPARTMENT_ACCENTS[nextDepartments.length % DEPARTMENT_ACCENTS.length]
        nextDepartments.push({
          id: departmentId,
          name: departmentName,
          nameKey: null,
          aliases: [departmentName],
          accent,
          isDefault: false,
          createdAt: new Date().toISOString(),
        })
        departmentByAlias.set(normalized, departmentId)
        return departmentId
      }

      const volunteerByIdentity = new Map(
        current.volunteers.map((volunteer) => [getVolunteerIdentityKey(volunteer), volunteer]),
      )

      const mergedVolunteers = [...current.volunteers]
      importedVolunteers.forEach((volunteer) => {
        const departmentId = ensureDepartment(volunteer.departmentName)
        const nextVolunteer = {
          ...volunteer,
          departmentId,
          importedAt: new Date().toISOString(),
        }
        delete nextVolunteer.departmentName
        delete nextVolunteer.roleName

        const identityKey = getVolunteerIdentityKey(nextVolunteer)
        const existing = volunteerByIdentity.get(identityKey)

        if (existing) {
          const index = mergedVolunteers.findIndex((item) => item.id === existing.id)
          mergedVolunteers[index] = { ...existing, ...nextVolunteer, id: existing.id }
        } else {
          mergedVolunteers.push(nextVolunteer)
          volunteerByIdentity.set(identityKey, nextVolunteer)
        }
      })

      return {
        ...current,
        departments: nextDepartments,
        volunteers: mergedVolunteers,
      }
    })
  }, [setData])

  const updateVolunteerDepartment = useCallback((volunteerId, departmentId) => {
    setData((current) => ({
      ...current,
      volunteers: current.volunteers.map((volunteer) =>
        volunteer.id === volunteerId ? { ...volunteer, departmentId } : volunteer,
      ),
    }))
  }, [setData])

  const createEvent = useCallback((event) => {
    setData((current) => {
      const {
        participantImports = [],
        participantIds = [],
        roleText = '',
        ...eventDetails
      } = event
      const departments = [...(current.departments ?? DEFAULT_DATA.departments)]
      const volunteers = [...(current.volunteers ?? DEFAULT_DATA.volunteers)]
      const events = current.events ?? DEFAULT_DATA.events
      const eventRoles = current.eventRoles ?? DEFAULT_DATA.eventRoles
      const departmentByAlias = new Map()

      departments.forEach((department) => {
        ;[department.name, ...(department.aliases ?? [])].forEach((alias) => {
          departmentByAlias.set(normalizeLabel(alias), department.id)
        })
      })

      const ensureDepartment = (departmentName) => {
        const fallbackDepartment = eventDetails.departmentId || departments[0]?.id || 'management'
        if (!departmentName) return fallbackDepartment

        const normalized = normalizeLabel(departmentName)
        const existingId = departmentByAlias.get(normalized)
        if (existingId) return existingId

        const departmentId = createId('dept')
        const accent = DEPARTMENT_ACCENTS[departments.length % DEPARTMENT_ACCENTS.length]
        departments.push({
          id: departmentId,
          name: departmentName,
          nameKey: null,
          aliases: [departmentName],
          accent,
          isDefault: false,
          createdAt: new Date().toISOString(),
        })
        departmentByAlias.set(normalized, departmentId)
        return departmentId
      }

      const volunteerByIdentity = new Map(
        volunteers.map((volunteer) => [getVolunteerIdentityKey(volunteer), volunteer]),
      )
      const importedParticipantIds = []
      const roleAssignments = new Map()

      participantImports.forEach((volunteer) => {
        const departmentId = ensureDepartment(volunteer.departmentName)
        const nextVolunteer = {
          ...volunteer,
          departmentId,
          importedAt: new Date().toISOString(),
        }
        const roleName = nextVolunteer.roleName?.trim()
        delete nextVolunteer.departmentName
        delete nextVolunteer.roleName

        const identityKey = getVolunteerIdentityKey(nextVolunteer)
        const existing = volunteerByIdentity.get(identityKey)
        let volunteerId = nextVolunteer.id

        if (existing) {
          volunteerId = existing.id
          const index = volunteers.findIndex((item) => item.id === existing.id)
          volunteers[index] = mergeVolunteerData(existing, {
            ...nextVolunteer,
            id: existing.id,
          })
        } else {
          volunteers.push(nextVolunteer)
          volunteerByIdentity.set(identityKey, nextVolunteer)
        }

        importedParticipantIds.push(volunteerId)

        if (roleName) {
          const existingRoleIds = roleAssignments.get(roleName) ?? []
          roleAssignments.set(roleName, dedupeIds([...existingRoleIds, volunteerId]))
        }
      })

      splitRoleText(roleText).forEach((roleName) => {
        if (!roleAssignments.has(roleName)) roleAssignments.set(roleName, [])
      })

      const eventId = createId('evt')
      const eventParticipantIds = dedupeIds([...participantIds, ...importedParticipantIds])
      const syncedRoles = [...roleAssignments.entries()].map(([roleName, assignedIds]) => ({
        id: createId('role'),
        eventId,
        title: roleName,
        titleKey: null,
        departmentId: eventDetails.departmentId,
        requiredCount: Math.max(assignedIds.length, 1),
        assignedVolunteerIds: assignedIds,
        notes: '',
        createdAt: new Date().toISOString(),
      }))

      return {
        ...current,
        departments,
        volunteers,
        events: [
          {
            id: eventId,
            createdAt: new Date().toISOString(),
            ...eventDetails,
            participantIds: eventParticipantIds,
            importedParticipantCount: participantImports.length,
          },
          ...events,
        ],
        eventRoles: [...syncedRoles, ...eventRoles],
      }
    })
  }, [setData])

  const createEventRole = useCallback((role) => {
    setData((current) => ({
      ...current,
      eventRoles: [
        {
          id: createId('role'),
          createdAt: new Date().toISOString(),
          ...role,
        },
        ...(current.eventRoles ?? []),
      ],
    }))
  }, [setData])

  const updateSettings = useCallback((settings) => {
    setData((current) => ({
      ...current,
      settings: {
        ...(current.settings ?? DEFAULT_DATA.settings),
        ...settings,
        themeColors: getSafeThemeColors(settings.themeColors),
        updatedAt: new Date().toISOString(),
      },
    }))
  }, [setData])

  const importBackupData = useCallback((payload) => {
    const nextData = normalizeBackupPayload(payload, DEFAULT_DATA)
    setData(nextData)
    return nextData
  }, [setData])

  const view = VIEW_KEYS.includes(activeView) ? activeView : 'dashboard'

  if (isPrivacyRoute) {
    return <PrivacyPolicy onBackHome={() => navigateTo('/')} />
  }

  return (
    <div
      className="min-h-screen bg-slate-100 text-slate-950"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        '--vc-primary': themeColors[0],
        '--vc-secondary': themeColors[1],
        '--vc-tertiary': themeColors[2],
        '--vc-accent': themeColors[3],
        '--vc-neutral': themeColors[4],
      }}
    >
      <div className="flex min-h-screen flex-col lg:flex-row rtl:lg:flex-row-reverse">
        <Sidebar
          activeView={view}
          onChange={setActiveView}
          settings={safeData.settings}
          themeColors={themeColors}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            activeView={view}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            themeColors={themeColors}
          />
          <main className="relative flex-1 overflow-hidden bg-slate-100 px-4 py-5 sm:px-6 lg:px-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-45 saturate-150 contrast-110"
              style={{
                backgroundImage: "url('/assets/dashboard-volunteer-background.png')",
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 app-background-field"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-white/42 backdrop-blur-[1px]"
            />
            <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5">
              {view === 'dashboard' && (
                <Dashboard data={safeData} timeframe={timeframe} />
              )}

              {view === 'volunteers' && (
                <>
                  <CsvImportPanel onImport={importVolunteers} />
                  <ManualVolunteerForm
                    departments={safeData.departments}
                    onAddVolunteer={addVolunteer}
                  />
                  <VolunteersTable
                    volunteers={safeData.volunteers}
                    departments={safeData.departments}
                    events={safeData.events}
                    onDepartmentChange={updateVolunteerDepartment}
                  />
                </>
              )}

              {view === 'departments' && (
                <DepartmentManager
                  departments={safeData.departments}
                  volunteers={safeData.volunteers}
                  events={safeData.events}
                  onAddDepartment={addDepartment}
                />
              )}

              {view === 'events' && (
                <EventCreation
                  volunteers={safeData.volunteers}
                  departments={safeData.departments}
                  events={safeData.events}
                  onCreateEvent={createEvent}
                />
              )}

              {view === 'roles' && (
                <EventRoles
                  volunteers={safeData.volunteers}
                  departments={safeData.departments}
                  events={safeData.events}
                  eventRoles={safeData.eventRoles}
                  onCreateRole={createEventRole}
                />
              )}

              {view === 'settings' && (
                <>
                  <OrganizationSettings
                    settings={safeData.settings}
                    onUpdateSettings={updateSettings}
                  />
                  <DataBackupPanel data={safeData} onImportData={importBackupData} />
                </>
              )}

              {view === 'alerts' && (
                <InactivityAlerts
                  volunteers={safeData.volunteers}
                  departments={safeData.departments}
                  events={safeData.events}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                />
              )}
            </div>
          </main>
          <footer className="relative overflow-hidden border-t border-slate-800 bg-slate-950 px-6 py-5 text-center text-xs text-slate-300">
            <div aria-hidden="true" className="footer-light-strip" />
            <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
              <span>{t('footer.local')}</span>
              <span className="font-medium text-white">
                {t('footer.rights', { year: copyrightYear })}
              </span>
              <button
                type="button"
                onClick={() => navigateTo('/privacy')}
                className="text-slate-300 underline-offset-4 transition hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                מדיניות פרטיות
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default App
