import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SubscriptionProvider } from './context/SubscriptionContext.jsx'
import './i18n'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SubscriptionProvider>
      <App />
    </SubscriptionProvider>
  </StrictMode>,
)
