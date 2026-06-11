import { useTranslation } from 'react-i18next'
import { UpgradeButton } from './UpgradeButton'
import { useSubscription } from '../hooks/useSubscription'

export function PremiumGate({ children, fallbackTitle }) {
  const { t } = useTranslation()
  const { hasPremium, isChecking } = useSubscription()

  if (isChecking) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-soft">
        {t('subscription.checking')}
      </section>
    )
  }

  if (hasPremium) {
    return children
  }

  return (
    <section className="rounded-md border border-amber-200 bg-amber-50/90 p-4 shadow-soft">
      <h2 className="text-lg font-semibold text-slate-950">
        {fallbackTitle ?? t('subscription.featureTitle')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {t('subscription.featureDescription')}
      </p>
      <div className="mt-4">
        <UpgradeButton />
      </div>
    </section>
  )
}
