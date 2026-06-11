import { useContext } from 'react'
import { SubscriptionContext } from '../context/subscriptionContext'

export function useSubscription() {
  const context = useContext(SubscriptionContext)

  if (!context) {
    throw new Error('useSubscription must be used inside SubscriptionProvider')
  }

  return context
}
