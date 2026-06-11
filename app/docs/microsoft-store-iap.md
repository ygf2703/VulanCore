# Microsoft Store In-App Subscription Integration

Product ID / in-app offer token:

```text
vulancore_monthly
```

Public Microsoft Store product URL:

```text
https://apps.microsoft.com/detail/9NNNQ38GS6CC
```

## Where The Code Lives

- Native Windows Store API:
  `windows-store/StoreSubscriptionService.cs`
- Optional WebView2 bridge:
  `windows-store/WebView2StoreBridge.cs`
- React bridge functions:
  `src/services/storeSubscription.js`
- React hook:
  `src/hooks/useSubscription.js`
- Root subscription provider:
  `src/context/SubscriptionContext.jsx`
- Optional UI helpers:
  `src/components/UpgradeButton.jsx`
  `src/components/PremiumGate.jsx`

## Required Windows Host

`Windows.Services.Store` is a Windows Runtime API. The Vite/React web app cannot call it directly in a normal browser. It must be called from the packaged Windows app host, such as UWP, WinUI 3, WPF + WebView2, WinForms + WebView2, or MAUI HybridWebView.

## App Startup Check

Call the native method when the Windows app starts:

```csharp
var storeService = new StoreSubscriptionService();
SubscriptionStatus status = await storeService.CheckMonthlySubscriptionAsync();
```

If the React UI is hosted in WebView2, register the bridge after `CoreWebView2` is ready:

```csharp
await webView.EnsureCoreWebView2Async();
var storeService = new StoreSubscriptionService();
var bridge = new WebView2StoreBridge(webView.CoreWebView2, storeService);
```

React can then call:

```js
import { checkMonthlySubscription } from './services/storeSubscription'

const status = await checkMonthlySubscription()
```

The app is already wired to check subscription status at React startup:

```jsx
<SubscriptionProvider>
  <App />
</SubscriptionProvider>
```

That wrapper lives in `src/main.jsx`, so every component can read the same entitlement state through `useSubscription()`.

## Upgrade Button

Use `UpgradeButton` anywhere a user should be able to subscribe:

```jsx
import { UpgradeButton } from './components/UpgradeButton'

<UpgradeButton />
```

The current app shell already renders this in `src/components/Header.jsx`, so the admin always has a visible upgrade path.

Internally this calls:

```js
purchaseMonthlySubscription()
```

The native host receives `store.purchaseMonthly` and calls:

```csharp
await storeService.PurchaseMonthlySubscriptionAsync();
```

That method opens the Microsoft Store purchase dialog for `vulancore_monthly`.

When the React app is running in a regular browser without the Windows WebView2
bridge, the same upgrade action opens the public Microsoft Store product page
instead.

## Locking Premium Features

Use `PremiumGate` around premium areas:

```jsx
import { PremiumGate } from './components/PremiumGate'

<PremiumGate fallbackTitle="Advanced Analytics">
  <AdvancedAnalytics />
</PremiumGate>
```

Or gate inline logic through the shared hook:

```jsx
const { hasPremium, isChecking, upgrade } = useSubscription()
```

Recommended premium gates for VolunCore:

- Advanced analytics charts
- Multi-organization branding profiles
- Export/import backup tools
- Event role optimization
- Long-term retention/cohort reports

Keep core admin flows usable without premium:

- Basic volunteer CSV import
- Basic event creation
- Basic department management

## Microsoft Store Notes

- The app must be packaged and associated with the Store app from Partner Center.
- The add-on must be published as a Subscription add-on.
- Test IAP from a Store-installed/test-flight package, not from a plain local browser.
- Purchase APIs that display Store UI must run on the UI thread.
- Store IAP is not supported while the app runs elevated as administrator.
- In packaged desktop apps, initialize `StoreContext` with the native window handle before displaying Store UI.
