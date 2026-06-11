import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { SubscriptionContext } from './subscriptionContext'
import {
  checkMonthlySubscription,
  purchaseMonthlySubscription,
} from '../services/storeSubscription'

const INITIAL_SUBSCRIPTION = {
  isActive: false,
  isChecking: true,
  error: null,
  expiresAt: null,
  purchaseStatus: null,
}

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(INITIAL_SUBSCRIPTION)

  const refreshSubscription = useCallback(async () => {
    setSubscription((current) => ({ ...current, isChecking: true, error: null }))
    const status = await checkMonthlySubscription()
    setSubscription({
      isActive: status.isActive,
      isChecking: false,
      error: status.error,
      expiresAt: status.expiresAt,
      purchaseStatus: null,
    })
    return status
  }, [])

  const upgrade = useCallback(async () => {
    setSubscription((current) => ({ ...current, isChecking: true, error: null }))
    const result = await purchaseMonthlySubscription()
    setSubscription({
      isActive: result.subscription.isActive,
      isChecking: false,
      error: result.extendedError,
      expiresAt: result.subscription.expiresAt,
      purchaseStatus: result.purchaseStatus,
    })
    return result
  }, [])

  useEffect(() => {
    let isMounted = true

    async function checkSubscriptionAtStartup() {
      const status = await checkMonthlySubscription()
      if (!isMounted) return

      setSubscription({
        isActive: status.isActive,
        isChecking: false,
        error: status.error,
        expiresAt: status.expiresAt,
        purchaseStatus: null,
      })
    }

    checkSubscriptionAtStartup()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      ...subscription,
      hasPremium: subscription.isActive,
      refreshSubscription,
      upgrade,
    }),
    [refreshSubscription, subscription, upgrade],
  )

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}
