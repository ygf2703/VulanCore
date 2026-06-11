export function MetricCard({ icon: Icon, label, value, detail, tone = 'blue' }) {
  const toneClass = tone === 'teal' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'

  return (
    <section className="rounded-md border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          {detail && <p className="mt-2 text-sm text-slate-500">{detail}</p>}
        </div>
        <div className={`rounded-md p-2 ${toneClass}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
