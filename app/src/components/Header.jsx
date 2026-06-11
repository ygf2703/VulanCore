import { Clock3, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UpgradeButton } from './UpgradeButton'

const TIMEFRAME_KEYS = ['monthly', 'quarterly', 'biannual', 'yearly']

export function Header({ activeView, timeframe, onTimeframeChange, themeColors }) {
  const { i18n, t } = useTranslation()
  const primaryColor = themeColors?.[0] ?? '#2563eb'

  const changeLanguage = () => {
    i18n.changeLanguage(i18n.language === 'he' ? 'en' : 'he')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 shadow-line backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">
            {t(`views.${activeView}.eyebrow`)}
          </p>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
            {t(`views.${activeView}.title`)}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <UpgradeButton />

          <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-line">
            <Clock3 className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="sr-only">{t('timeframes.label')}</span>
            <select
              value={timeframe}
              onChange={(event) => onTimeframeChange(event.target.value)}
              className="bg-transparent text-slate-800 outline-none"
            >
              {TIMEFRAME_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`timeframes.${key}`)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={changeLanguage}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label={t('actions.switchLanguage')}
            style={{ backgroundColor: primaryColor }}
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            <span>{t('actions.switchLanguage')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
