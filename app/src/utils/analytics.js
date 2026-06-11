import {
  createMonthBuckets,
  getMonthKey,
  getWindowStart,
  parseDateValue,
} from './dates'

export function buildActivityMap(volunteers, events) {
  const activityMap = new Map(
    volunteers.map((volunteer) => [
      volunteer.id,
      {
        totalEvents: 0,
        lastParticipationDate: null,
      },
    ]),
  )

  events.forEach((event) => {
    const eventDate = parseDateValue(event.date)
    if (!eventDate) return

    event.participantIds.forEach((volunteerId) => {
      const activity = activityMap.get(volunteerId)
      if (!activity) return

      activity.totalEvents += 1
      if (
        !activity.lastParticipationDate ||
        eventDate > parseDateValue(activity.lastParticipationDate)
      ) {
        activity.lastParticipationDate = event.date
      }
    })
  })

  return activityMap
}

export function getWindowEvents(events, timeframe) {
  const windowStart = getWindowStart(timeframe)
  return events.filter((event) => {
    const date = parseDateValue(event.date)
    return date && date >= windowStart
  })
}

export function getInactiveVolunteers(volunteers, events, timeframe) {
  const activityMap = buildActivityMap(volunteers, events)
  const windowStart = getWindowStart(timeframe)

  return volunteers
    .map((volunteer) => {
      const activity = activityMap.get(volunteer.id) ?? {
        totalEvents: 0,
        lastParticipationDate: null,
      }

      return {
        ...volunteer,
        totalEvents: activity.totalEvents,
        lastParticipationDate: activity.lastParticipationDate,
      }
    })
    .filter((volunteer) => {
      const lastDate = parseDateValue(volunteer.lastParticipationDate)
      return !lastDate || lastDate < windowStart
    })
    .sort((first, second) => {
      const firstDate = parseDateValue(first.lastParticipationDate)?.getTime() ?? 0
      const secondDate = parseDateValue(second.lastParticipationDate)?.getTime() ?? 0
      return firstDate - secondDate
    })
}

export function buildDepartmentActivity(data, timeframe) {
  const { departments, volunteers, events } = data
  const windowEvents = getWindowEvents(events, timeframe)
  const volunteerById = new Map(volunteers.map((volunteer) => [volunteer.id, volunteer]))

  return departments.map((department) => {
    const members = volunteers.filter((volunteer) => volunteer.departmentId === department.id)
    const activeVolunteerIds = new Set()
    let participations = 0

    windowEvents.forEach((event) => {
      event.participantIds.forEach((volunteerId) => {
        const volunteer = volunteerById.get(volunteerId)
        if (volunteer?.departmentId !== department.id) return

        activeVolunteerIds.add(volunteerId)
        participations += 1
      })
    })

    return {
      departmentId: department.id,
      members: members.length,
      activeVolunteers: activeVolunteerIds.size,
      participations,
    }
  })
}

export function buildEventTrend(events, timeframe, language) {
  const buckets = createMonthBuckets(timeframe, language)
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  getWindowEvents(events, timeframe).forEach((event) => {
    const key = getMonthKey(event.date)
    const bucket = bucketByKey.get(key)
    if (!bucket) return

    bucket.participants += event.participantIds.length
    bucket.events += 1
  })

  return buckets
}

export function getAverageParticipationRate(events, volunteers, timeframe) {
  const windowEvents = getWindowEvents(events, timeframe)
  if (!volunteers.length || !windowEvents.length) return 0

  const average =
    windowEvents.reduce(
      (total, event) => total + event.participantIds.length / volunteers.length,
      0,
    ) / windowEvents.length

  return Math.round(average * 100)
}

export function getRoleCoverage(events, eventRoles = [], timeframe) {
  const windowEventIds = new Set(getWindowEvents(events, timeframe).map((event) => event.id))
  const roles = eventRoles.filter((role) => windowEventIds.has(role.eventId))
  const required = roles.reduce((total, role) => total + Number(role.requiredCount || 0), 0)
  const assigned = roles.reduce(
    (total, role) =>
      total + Math.min(role.assignedVolunteerIds?.length ?? 0, Number(role.requiredCount || 0)),
    0,
  )
  const open = Math.max(required - assigned, 0)

  return {
    roles: roles.length,
    required,
    assigned,
    open,
    coverageRate: required ? Math.round((assigned / required) * 100) : 100,
  }
}

export function buildRoleCoverageByEvent(events, eventRoles = [], timeframe) {
  const rolesByEvent = eventRoles.reduce((map, role) => {
    const existing = map.get(role.eventId) ?? []
    existing.push(role)
    map.set(role.eventId, existing)
    return map
  }, new Map())

  return getWindowEvents(events, timeframe).map((event) => {
    const roles = rolesByEvent.get(event.id) ?? []
    const required = roles.reduce((total, role) => total + Number(role.requiredCount || 0), 0)
    const assigned = roles.reduce(
      (total, role) =>
        total + Math.min(role.assignedVolunteerIds?.length ?? 0, Number(role.requiredCount || 0)),
      0,
    )

    return {
      eventId: event.id,
      required,
      assigned,
      open: Math.max(required - assigned, 0),
      roles: roles.length,
    }
  })
}
