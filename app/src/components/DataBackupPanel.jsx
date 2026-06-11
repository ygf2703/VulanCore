import { DatabaseBackup, Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createBackupPayload } from '../utils/dataBackup'

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 250)
}

export function DataBackupPanel({ data, onImportData }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState('')

  const handleExport = () => {
    const payload = createBackupPayload(data)
    const date = new Date().toISOString().slice(0, 10)
    downloadJson(payload, `voluncore-backup-${date}.json`)
    setStatus(t('backup.exported'))
  }

  const handleImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result ?? '{}'))
        onImportData(payload)
        setStatus(t('backup.imported'))
      } catch {
        setStatus(t('backup.importIssue'))
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-md bg-amber-50 p-2 text-amber-700">
          <DatabaseBackup className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{t('backup.title')}</h2>
          <p className="text-sm text-slate-500">{t('backup.description')}</p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-3">
          <span>{t('backup.volunteers', { count: data.volunteers.length })}</span>
          <span>{t('backup.events', { count: data.events.length })}</span>
          <span>{t('backup.departments', { count: data.departments.length })}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-line transition hover:bg-blue-700"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{t('backup.export')}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-line transition hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{t('backup.import')}</span>
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{t('backup.warning')}</p>

      {status && (
        <p className="mt-3 rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-700">
          {status}
        </p>
      )}
    </section>
  )
}
