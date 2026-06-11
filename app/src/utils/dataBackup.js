import { DATA_SCHEMA_VERSION } from '../data/schema'
import { getSafeThemeColors } from './theme'

function ensureArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback
}

function ensureObject(value, fallback = {}) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback
}

export function createBackupPayload(data) {
  return {
    app: 'VolunCore',
    schemaVersion: DATA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function normalizeBackupPayload(payload, fallbackData) {
  const source = ensureObject(payload?.data ?? payload)
  const fallback = ensureObject(fallbackData)

  if (!Array.isArray(source.volunteers) || !Array.isArray(source.events)) {
    throw new Error('Invalid VolunCore backup file')
  }

  const fallbackSettings = ensureObject(fallback.settings)
  const importedSettings = ensureObject(source.settings, fallbackSettings)

  return {
    schemaVersion: DATA_SCHEMA_VERSION,
    settings: {
      ...fallbackSettings,
      ...importedSettings,
      themeColors: getSafeThemeColors(importedSettings.themeColors),
      updatedAt: new Date().toISOString(),
    },
    departments: ensureArray(source.departments, ensureArray(fallback.departments)),
    volunteers: source.volunteers,
    events: source.events,
    eventRoles: ensureArray(source.eventRoles, ensureArray(fallback.eventRoles)),
  }
}
