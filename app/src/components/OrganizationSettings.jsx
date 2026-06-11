import { ImagePlus, Palette, RotateCcw, Save } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FALLBACK_THEME_COLORS, getSafeThemeColors, normalizeHexColor } from '../utils/theme'

export function OrganizationSettings({ settings, onUpdateSettings }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    organizationName: settings?.organizationName ?? '',
    logoDataUrl: settings?.logoDataUrl ?? null,
    themeColors: getSafeThemeColors(settings?.themeColors),
  })
  const [status, setStatus] = useState('')

  const updateColor = (index, value) => {
    setForm((current) => {
      const themeColors = [...current.themeColors]
      themeColors[index] = value
      return { ...current, themeColors }
    })
  }

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, logoDataUrl: reader.result }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onUpdateSettings({
      organizationName: form.organizationName.trim() || t('settings.defaultOrgName'),
      logoDataUrl: form.logoDataUrl,
      themeColors: getSafeThemeColors(form.themeColors),
    })
    setStatus(t('settings.saved'))
  }

  const resetColors = () => {
    setForm((current) => ({ ...current, themeColors: FALLBACK_THEME_COLORS }))
  }

  const removeLogo = () => {
    setForm((current) => ({ ...current, logoDataUrl: null }))
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-md bg-blue-50 p-2 text-blue-700">
          <Palette className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{t('settings.title')}</h2>
          <p className="text-sm text-slate-500">{t('settings.description')}</p>
        </div>
      </div>

      <form className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]" onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            {t('settings.organizationName')}
            <input
              value={form.organizationName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  organizationName: event.target.value,
                }))
              }
              className="min-h-11 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-900 outline-none transition focus:border-blue-300"
            />
          </label>

          <div className="grid gap-3">
            <p className="text-sm font-medium text-slate-700">{t('settings.logo')}</p>
            <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
              <img
                src={form.logoDataUrl || '/assets/voluncore-logo.png'}
                alt={t('brand.logoAlt')}
                className="h-20 w-20 rounded-md border border-slate-200 bg-white object-cover shadow-line"
              />
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-line transition hover:bg-blue-700"
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>{t('settings.uploadLogo')}</span>
                </button>
                <button
                  type="button"
                  onClick={removeLogo}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-line transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>{t('settings.defaultLogo')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">{t('settings.themeColors')}</p>
              <p className="text-sm text-slate-500">{t('settings.themeDescription')}</p>
            </div>
            <button
              type="button"
              onClick={resetColors}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-line transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>{t('settings.resetColors')}</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {form.themeColors.map((color, index) => (
              <label
                key={`${index}-${color}`}
                className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700"
              >
                {t('settings.colorLabel', { index: index + 1 })}
                <input
                  type="color"
                  value={normalizeHexColor(color) ?? FALLBACK_THEME_COLORS[index]}
                  onChange={(event) => updateColor(index, event.target.value)}
                  className="h-11 w-full rounded-md border border-slate-200 bg-white p-1"
                />
                <input
                  value={color}
                  onChange={(event) => updateColor(index, event.target.value)}
                  className="min-h-10 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:border-blue-300"
                />
              </label>
            ))}
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="mb-3 text-sm font-medium text-slate-700">
              {t('settings.preview')}
            </p>
            <div className="grid gap-2 sm:grid-cols-5">
              {getSafeThemeColors(form.themeColors).map((color, index) => (
                <div
                  key={`${color}-${index}`}
                  className="h-14 rounded-md border border-slate-200 shadow-line"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            style={{ backgroundColor: getSafeThemeColors(form.themeColors)[0] }}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>{t('settings.save')}</span>
          </button>
        </div>
      </form>

      {status && (
        <p className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-700">
          {status}
        </p>
      )}
    </section>
  )
}
