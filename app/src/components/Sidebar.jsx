import clsx from 'clsx'
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Palette,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const NAV_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'volunteers', icon: Users },
  { key: 'departments', icon: Building2 },
  { key: 'events', icon: CalendarDays },
  { key: 'roles', icon: ClipboardList },
  { key: 'alerts', icon: Bell },
  { key: 'settings', icon: Palette },
]

export function Sidebar({ activeView, onChange, settings, themeColors }) {
  const { t } = useTranslation()
  const primaryColor = themeColors?.[0] ?? '#2563eb'
  const logoSrc = settings?.logoDataUrl || '/assets/voluncore-logo.png'

  return (
    <aside className="shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 ltr:lg:border-r rtl:lg:border-l">
      <div className="flex h-full flex-col gap-6 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <img
            src={logoSrc}
            alt={t('brand.logoAlt')}
            className="h-14 w-14 rounded-md border border-slate-200 bg-white object-cover shadow-line"
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-slate-950">{t('brand.name')}</p>
            <p className="truncate text-sm text-slate-500">
              {settings?.organizationName || t('brand.subtitle')}
            </p>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.key

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={clsx(
                  'group flex min-h-11 shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-blue-50 shadow-line ring-1 ring-blue-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${primaryColor}14`,
                        color: primaryColor,
                        boxShadow: `inset 0 0 0 1px ${primaryColor}24`,
                      }
                    : undefined
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{t(`nav.${item.key}`)}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
