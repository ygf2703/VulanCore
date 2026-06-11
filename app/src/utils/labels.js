export function normalizeLabel(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_.-]+/g, '')
}

export function getDepartmentLabel(department, t) {
  if (!department) return ''
  return department.nameKey ? t(department.nameKey) : department.name
}

export function getEventTitle(event, t) {
  if (!event) return ''
  return event.titleKey ? t(event.titleKey) : event.title
}

export function getEventRoleTitle(role, t) {
  if (!role) return ''
  return role.titleKey ? t(role.titleKey) : role.title
}

export function getVolunteerName(volunteer) {
  return [volunteer.firstName, volunteer.lastName].filter(Boolean).join(' ')
}

export function getVolunteerIdentityKey(volunteer) {
  const email = String(volunteer.email ?? '').trim().toLocaleLowerCase()
  if (email) return `email:${email}`

  const phone = normalizeLabel(volunteer.phone)
  if (phone) return `phone:${phone}`

  return `name:${normalizeLabel(getVolunteerName(volunteer))}`
}
