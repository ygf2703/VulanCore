export const MICROSOFT_STORE_SUBSCRIPTION_PRODUCT_ID = 'vulancore_monthly'
export const MICROSOFT_STORE_PRODUCT_URL = 'https://apps.microsoft.com/detail/9NNNQ38GS6CC'

const REQUEST_TIMEOUT_MS = 120000

function hasWindowsStoreBridge() {
  return Boolean(globalThis.window?.chrome?.webview?.postMessage)
}

function createRequestId() {
  return `store-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getField(source, camelName, pascalName) {
  return source?.[camelName] ?? source?.[pascalName]
}

function normalizeSubscriptionPayload(payload) {
  return {
    isActive: Boolean(getField(payload, 'isActive', 'IsActive')),
    productId:
      getField(payload, 'productId', 'ProductId') ??
      MICROSOFT_STORE_SUBSCRIPTION_PRODUCT_ID,
    expiresAt: getField(payload, 'expiresAt', 'ExpiresAt') ?? null,
    skuStoreId: getField(payload, 'skuStoreId', 'SkuStoreId') ?? null,
    unavailable: Boolean(getField(payload, 'unavailable', 'Unavailable')),
  }
}

function sendStoreMessage(type, payload = {}) {
  if (!hasWindowsStoreBridge()) {
    return Promise.resolve({
      ok: false,
      error: 'Windows Store bridge is unavailable in this runtime.',
      payload: {
        isActive: false,
        productId: MICROSOFT_STORE_SUBSCRIPTION_PRODUCT_ID,
        unavailable: true,
      },
    })
  }

  return new Promise((resolve) => {
    const requestId = createRequestId()
    const timeout = window.setTimeout(() => {
      window.chrome.webview.removeEventListener('message', handleMessage)
      resolve({
        ok: false,
        error: 'Timed out waiting for Microsoft Store response.',
        payload: {
          isActive: false,
          productId: MICROSOFT_STORE_SUBSCRIPTION_PRODUCT_ID,
        },
      })
    }, REQUEST_TIMEOUT_MS)

    function handleMessage(event) {
      const message = event.data
      if (!message || message.requestId !== requestId) return

      window.clearTimeout(timeout)
      window.chrome.webview.removeEventListener('message', handleMessage)
      resolve(message)
    }

    window.chrome.webview.addEventListener('message', handleMessage)
    window.chrome.webview.postMessage({
      type,
      requestId,
      payload: {
        productId: MICROSOFT_STORE_SUBSCRIPTION_PRODUCT_ID,
        ...payload,
      },
    })
  })
}

export async function checkMonthlySubscription() {
  const response = await sendStoreMessage('store.checkSubscription')
  const subscription = normalizeSubscriptionPayload(response.payload)

  return {
    ...subscription,
    error: response.ok === false ? response.error : null,
  }
}

export async function purchaseMonthlySubscription() {
  if (!hasWindowsStoreBridge()) {
    globalThis.window?.open?.(MICROSOFT_STORE_PRODUCT_URL, '_blank', 'noopener,noreferrer')

    return {
      purchaseStatus: 'Store page opened',
      extendedError: null,
      subscription: normalizeSubscriptionPayload({
        isActive: false,
        productId: MICROSOFT_STORE_SUBSCRIPTION_PRODUCT_ID,
        unavailable: true,
      }),
    }
  }

  const response = await sendStoreMessage('store.purchaseMonthly')
  const subscriptionPayload =
    getField(response.payload, 'subscription', 'Subscription') ?? {}
  const subscription = normalizeSubscriptionPayload(subscriptionPayload)

  return {
    purchaseStatus: getField(response.payload, 'status', 'Status') ?? 'Unavailable',
    extendedError:
      getField(response.payload, 'extendedError', 'ExtendedError') ??
      response.error ??
      null,
    subscription,
  }
}

export function isWindowsStoreBridgeAvailable() {
  return hasWindowsStoreBridge()
}
