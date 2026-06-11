export const DATA_SCHEMA_VERSION = 4

export const DATA_MODEL = {
  schemaVersion: DATA_SCHEMA_VERSION,
  departments: [
    {
      id: 'string',
      name: 'string',
      nameKey: 'nullable i18n key',
      aliases: ['string'],
      accent: 'hex color',
      isDefault: 'boolean',
      createdAt: 'ISO datetime',
    },
  ],
  settings: {
    organizationName: 'string',
    logoDataUrl: 'nullable data URL',
    themeColors: ['five hex colors'],
    updatedAt: 'optional ISO datetime',
  },
  volunteers: [
    {
      id: 'string',
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      phone: 'string',
      city: 'string',
      skills: ['string'],
      departmentId: 'string',
      joinedAt: 'ISO date',
      importedAt: 'optional ISO datetime',
      createdAt: 'optional ISO datetime',
    },
  ],
  events: [
    {
      id: 'string',
      title: 'string',
      titleKey: 'nullable i18n key',
      date: 'ISO date',
      durationHours: 'number',
      departmentId: 'string',
      managerName: 'string',
      participantIds: ['volunteer id'],
      importedParticipantCount: 'number',
      createdAt: 'ISO datetime',
    },
  ],
  eventRoles: [
    {
      id: 'string',
      eventId: 'string',
      title: 'string',
      titleKey: 'nullable i18n key',
      departmentId: 'string',
      requiredCount: 'number',
      assignedVolunteerIds: ['volunteer id'],
      notes: 'string',
      createdAt: 'ISO datetime',
    },
  ],
}
