import {
  createMonthBuckets,
  getMonthKey,
  getWindowStart,
  parseDateValue,
} from './dates'

export const DEFAULT_EVENT_DURATION_HOURS = 2

export function getEventDurationHours(event) {
  const duration = Number(event?.durationHours)
  return Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_EVENT_DURATION_HOURS
}

export function buildActivityMap(volunteers, events) {
  const activityMap = new Map(
    volunteers.map((volunteer) => [
      volunteer.id,
      {
        totalEvents: 0,
        totalHours: 0,
        lastParticipationDate: null,
      },
    ]),
  )

  events.forEach((event) => {
    const eventDate = parseDateValue(event.date)
    if (!eventDate) return
    const durationHours = getEventDurationHours(event)

    event.participantIds.forEach((volunteerId) => {
      const activity = activityMap.get(volunteerId)
      if (!activity) return

      activity.totalEvents += 1
      activity.totalHours += durationHours
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
        totalHours: 0,
        lastParticipationDate: null,
      }

      return {
        ...volunteer,
        totalEvents: activity.totalEvents,
        totalHours: activity.totalHours,
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
    let totalHours = 0

    windowEvents.forEach((event) => {
      const durationHours = getEventDurationHours(event)
      event.participantIds.forEach((volunteerId) => {
        const volunteer = volunteerById.get(volunteerId)
        if (volunteer?.departmentId !== department.id) return

        activeVolunteerIds.add(volunteerId)
        participations += 1
        totalHours += durationHours
      })
    })

    return {
      departmentId: department.id,
      members: members.length,
      activeVolunteers: activeVolunteerIds.size,
      participations,
      totalHours: Number(totalHours.toFixed(1)),
      averageHours: activeVolunteerIds.size
        ? Number((totalHours / activeVolunteerIds.size).toFixed(1))
        : 0,
    }
  })
}

export function buildVolunteerLeaderboard(volunteers, events, timeframe) {
  const windowEvents = getWindowEvents(events, timeframe)
  const activityMap = buildActivityMap(volunteers, windowEvents)

  return volunteers
    .map((volunteer) => {
      const activity = activityMap.get(volunteer.id) ?? {
        totalEvents: 0,
        totalHours: 0,
        lastParticipationDate: null,
      }

      return {
        ...volunteer,
        totalEvents: activity.totalEvents,
        totalHours: Number(activity.totalHours.toFixed(1)),
        lastParticipationDate: activity.lastParticipationDate,
      }
    })
    .filter((volunteer) => volunteer.totalEvents > 0)
    .sort((first, second) => {
      if (second.totalHours !== first.totalHours) return second.totalHours - first.totalHours
      if (second.totalEvents !== first.totalEvents) return second.totalEvents - first.totalEvents
      return String(first.firstName ?? '').localeCompare(String(second.firstName ?? ''))
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
