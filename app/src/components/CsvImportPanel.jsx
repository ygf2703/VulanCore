import { FileSpreadsheet, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseVolunteerCsv } from '../utils/csvImport'

export function CsvImportPanel({ onImport }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState({ tone: 'slate', message: '' })

  const openFilePicker = () => fileInputRef.current?.click()

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const volunteers = await parseVolunteerCsv(file)
      if (!volunteers.length) {
        setStatus({ tone: 'amber', message: t('volunteers.importEmpty') })
        return
      }

      onImport(volunteers)
      setStatus({
        tone: 'teal',
        message: t('volunteers.importReady', { count: volunteers.length }),
      })
    } catch {
      setStatus({ tone: 'amber', message: t('volunteers.importIssue') })
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-blue-50 p-2 text-blue-700">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {t('volunteers.importTitle')}
            </h2>
            <p className="text-sm text-slate-500">{t('volunteers.importHint')}</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={openFilePicker}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          <span>{t('actions.import')}</span>
        </button>
      </div>

      {status.message && (
        <p
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            status.tone === 'teal'
              ? 'bg-teal-50 text-teal-700'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          {status.message}
        </p>
      )}
    </section>
  )
}
