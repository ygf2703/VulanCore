import {
  Activity,
  Award,
  BadgeAlert,
  Building2,
  CalendarDays,
  ChartPie,
  ClipboardCheck,
  Hand,
  Medal,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  buildDepartmentActivity,
  buildEventTrend,
  buildRoleCoverageByEvent,
  buildVolunteerLeaderboard,
  getAverageParticipationRate,
  getInactiveVolunteers,
  getRoleCoverage,
  getWindowEvents,
} from '../utils/analytics'
import { formatDisplayDate } from '../utils/dates'
import { getDepartmentLabel, getEventTitle, getVolunteerName } from '../utils/labels'
import { DashboardPulseScene } from './DashboardPulseScene'
import { InactivityAlerts } from './InactivityAlerts'
import { MetricCard } from './MetricCard'

const CHART_SLATE = '#64748b'
const PANEL_CLASS =
  'rounded-md border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur-md'
const RANK_ICONS = [Trophy, Medal, Award]

const tooltipStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
}

export function Dashboard({ data, timeframe }) {
  const { i18n, t } = useTranslation()
  const chartColors = data.settings?.themeColors ?? []
  const chartPrimary = chartColors[0] ?? '#2563eb'
  const chartSecondary = chartColors[1] ?? '#facc15'
  const chartDark = chartColors[3] ?? '#0f172a'
  const chartSoft = chartColors[4] ?? '#94a3b8'
  const chartPalette = chartColors.length
    ? chartColors
    : [chartPrimary, chartSecondary, chartDark, chartSoft]

  const departmentById = useMemo(
    () => new Map(data.departments.map((department) => [department.id, department])),
    [data.departments],
  )

  const departmentActivity = useMemo(
    () =>
      buildDepartmentActivity(data, timeframe).map((row) => ({
        ...row,
        name: getDepartmentLabel(departmentById.get(row.departmentId), t),
      })),
    [data, departmentById, timeframe, t],
  )

  const trend = useMemo(
    () => buildEventTrend(data.events, timeframe, i18n.language),
    [data.events, timeframe, i18n.language],
  )

  const windowEvents = useMemo(
    () => getWindowEvents(data.events, timeframe),
    [data.events, timeframe],
  )

  const eventImpact = useMemo(
    () =>
      windowEvents
        .slice()
        .sort((first, second) => new Date(first.date) - new Date(second.date))
        .map((event) => ({
          name: getEventTitle(event, t),
          participants: event.participantIds.length,
        })),
    [windowEvents, t],
  )

  const roleCoverage = useMemo(
    () => getRoleCoverage(data.events, data.eventRoles, timeframe),
    [data.events, data.eventRoles, timeframe],
  )

  const roleCoverageRows = useMemo(
    () =>
      buildRoleCoverageByEvent(data.events, data.eventRoles, timeframe)
        .filter((row) => row.roles > 0)
        .map((row) => ({
          ...row,
          name: getEventTitle(data.events.find((event) => event.id === row.eventId), t),
        })),
    [data.events, data.eventRoles, timeframe, t],
  )

  const averageRate = getAverageParticipationRate(data.events, data.volunteers, timeframe)
  const inactiveVolunteers = getInactiveVolunteers(data.volunteers, data.events, timeframe)
  const volunteerLeaderboard = useMemo(
    () => buildVolunteerLeaderboard(data.volunteers, data.events, timeframe),
    [data.events, data.volunteers, timeframe],
  )
  const activeLeaderboard = volunteerLeaderboard.slice(0, 5)
  const inactiveSpotlight = inactiveVolunteers.slice(0, 5)
  const totalActivityHours = departmentActivity.reduce(
    (total, department) => total + department.totalHours,
    0,
  )
  const averageVolunteerHours = volunteerLeaderboard.length
    ? Number(
        (
          totalActivityHours /
          new Set(volunteerLeaderboard.map((volunteer) => volunteer.id)).size
        ).toFixed(1),
      )
    : 0
  const departmentHourSplit = departmentActivity
    .filter((department) => department.totalHours > 0)
    .map((department) => ({
      ...department,
      value: department.totalHours,
    }))
  const pulseMetrics = [
    { label: t('metrics.volunteers'), value: data.volunteers.length },
    { label: t('metrics.events'), value: windowEvents.length },
    { label: t('metrics.roleCoverage'), value: `${roleCoverage.coverageRate}%` },
  ]

  return (
    <>
      <section
        className="relative min-h-[20rem] overflow-hidden rounded-md bg-slate-950 shadow-soft"
        style={{
          '--pulse-primary': chartPrimary,
          '--pulse-secondary': chartSecondary,
          '--pulse-dark': chartDark,
        }}
      >
        <DashboardPulseScene colors={chartColors} />
        <div aria-hidden="true" className="absolute inset-0 dashboard-pulse-overlay" />
        <div className="relative z-10 grid min-h-[20rem] gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(22rem,1fr)] lg:items-end">
          <div className="max-w-xl self-center">
            <p className="text-sm font-semibold text-amber-200">
              {t('pulse.eyebrow')}
            </p>
            <h2 className="mt-2 max-w-lg text-3xl font-semibold text-white sm:text-4xl">
              {t('pulse.title')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
              {t('pulse.description', {
                count: data.volunteers.length,
                rate: averageRate,
              })}
            </p>
          </div>

          <div className="grid gap-2 self-end sm:grid-cols-3">
            {pulseMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-md border border-white/15 bg-white/10 p-3 text-white shadow-line backdrop-blur"
              >
                <p className="text-xs font-medium text-slate-300">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          icon={Users}
          label={t('metrics.volunteers')}
          value={data.volunteers.length}
          detail={t('metrics.activeVolunteers', {
            count: data.volunteers.length - inactiveVolunteers.length,
          })}
        />
        <MetricCard
          icon={Building2}
          label={t('metrics.departments')}
          value={data.departments.length}
          detail={t('departments.defaultBadge')}
          tone="teal"
        />
        <MetricCard
          icon={CalendarDays}
          label={t('metrics.events')}
          value={windowEvents.length}
          detail={t('metrics.eventCount', { count: data.events.length })}
        />
        <MetricCard
          icon={TrendingUp}
          label={t('metrics.averageRate')}
          value={t('metrics.participationRate', { rate: averageRate })}
          detail={t(`timeframes.${timeframe}`)}
          tone="teal"
        />
        <MetricCard
          icon={ClipboardCheck}
          label={t('metrics.roleCoverage')}
          value={t('metrics.participationRate', { rate: roleCoverage.coverageRate })}
          detail={t('roles.openSlots', { count: roleCoverage.open })}
        />
        <MetricCard
          icon={Activity}
          label={t('metrics.activityHours')}
          value={t('metrics.hoursValue', { count: totalActivityHours.toFixed(1) })}
          detail={t('metrics.averageHoursValue', { count: averageVolunteerHours })}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <ChartPie className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">
              {t('charts.departmentActivitySplit')}
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [
                      t('metrics.hoursValue', { count: Number(value).toFixed(1) }),
                      t('charts.activityHours'),
                    ]}
                  />
                  <Pie
                    data={departmentHourSplit}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={64}
                    outerRadius={104}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {departmentHourSplit.map((entry, index) => (
                      <Cell
                        key={entry.departmentId}
                        fill={chartPalette[index % chartPalette.length] ?? chartPrimary}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {departmentHourSplit.map((department, index) => (
                <div
                  key={department.departmentId}
                  className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          chartPalette[index % chartPalette.length] ?? chartPrimary,
                      }}
                    />
                    {department.name}
                  </span>
                  <span className="text-slate-500">
                    {t('metrics.hoursValue', { count: department.totalHours })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">
              {t('charts.averageActivityHours')}
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentActivity}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                <Bar dataKey="averageHours" name={t('charts.averageHours')} fill={chartPrimary} radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalHours" name={t('charts.totalHours')} fill={chartSecondary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">
              {t('insights.topActiveVolunteers')}
            </h2>
          </div>
          <div className="grid gap-2">
            {activeLeaderboard.length ? (
              activeLeaderboard.map((volunteer, index) => {
                const RankIcon = RANK_ICONS[index] ?? Medal

                return (
                  <div
                    key={volunteer.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                        <RankIcon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">
                          {getVolunteerName(volunteer)}
                        </p>
                        <p className="text-sm text-slate-500">
                          {t('insights.eventCount', { count: volunteer.totalEvents })}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-white px-2.5 py-1 text-sm font-semibold text-slate-700 shadow-line">
                      {t('metrics.hoursValue', { count: volunteer.totalHours })}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="rounded-md bg-slate-50 px-3 py-3 text-sm text-slate-500">
                {t('insights.noActiveVolunteers')}
              </p>
            )}
          </div>
        </section>

        <section className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <BadgeAlert className="h-5 w-5 text-amber-700" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">
              {t('insights.inactiveSpotlight')}
            </h2>
          </div>
          <div className="grid gap-2">
            {inactiveSpotlight.length ? (
              inactiveSpotlight.map((volunteer) => (
                <div
                  key={volunteer.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-amber-700 shadow-line">
                      <Hand className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {getVolunteerName(volunteer)}
                      </p>
                      <p className="text-sm text-amber-800">
                        {volunteer.lastParticipationDate
                          ? t('insights.lastSeen', {
                              date: formatDisplayDate(
                                volunteer.lastParticipationDate,
                                i18n.language,
                              ),
                            })
                          : t('volunteers.never')}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-white px-2.5 py-1 text-sm font-semibold text-amber-800 shadow-line">
                    {t('insights.gentleNudge')}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-md bg-teal-50 px-3 py-3 text-sm text-teal-700">
                {t('insights.noInactiveVolunteers')}
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">
              {t('charts.departmentActivity')}
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentActivity}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                <Bar dataKey="members" name={t('charts.members')} fill={chartSecondary} radius={[6, 6, 0, 0]} />
                <Bar dataKey="participations" name={t('charts.participations')} fill={chartPrimary} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-950">
              {t('charts.eventTrend')}
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="participants"
                  name={t('charts.participants')}
                  stroke={chartPrimary}
                  strokeWidth={3}
                  dot={{ r: 4, fill: chartSecondary, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className={PANEL_CLASS}>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-950">
            {t('charts.eventImpact')}
          </h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventImpact}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(15, 118, 110, 0.08)' }} />
              <Bar dataKey="participants" name={t('charts.participants')} fill={chartDark} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <div className="mb-4 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-950">
            {t('charts.roleCoverage')}
          </h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleCoverageRows}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART_SLATE, fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(217, 119, 6, 0.08)' }} />
              <Bar dataKey="required" name={t('roles.requiredCount')} fill={chartSoft} radius={[6, 6, 0, 0]} />
              <Bar dataKey="assigned" name={t('roles.assignedVolunteers')} fill={chartPrimary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <InactivityAlerts
        volunteers={data.volunteers}
        departments={data.departments}
        events={data.events}
        timeframe={timeframe}
        compact
      />
    </>
  )
}
