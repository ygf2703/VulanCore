import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscription } from '../hooks/useSubscription'

export function UpgradeButton({ onSubscriptionChanged }) {
  const { t } = useTranslation()
  const { hasPremium, isChecking, upgrade } = useSubscription()
  const [message, setMessage] = useState('')

  const handleUpgrade = async () => {
    const result = await upgrade()
    setMessage(
      result.subscription.isActive
        ? t('subscription.activeMessage')
        : result.extendedError ||
            t('subscription.purchaseStatus', { status: result.purchaseStatus }),
    )
    onSubscriptionChanged?.(result.subscription)
  }

  if (hasPremium) {
    return (
      <span className="inline-flex min-h-10 items-center rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
        {t('subscription.active')}
      </span>
    )
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={isChecking}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span>{isChecking ? t('subscription.checking') : t('subscription.upgrade')}</span>
      </button>
      {message && <p className="text-xs text-slate-500">{message}</p>}
    </div>
  )
}
