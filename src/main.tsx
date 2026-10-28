import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/fonts.css'
import App from './App'
import { AppProviders } from '@/app/providers/AppProviders'
import { enableMocking } from '@/mocks/browser'
import { useAuthStore } from '@/store/authStore'

// Start the MSW mock backend only if it's explicitly enabled (VITE_ENABLE_MSW=true);
// otherwise this resolves immediately and the app talks to the real backend. Then
// mount the provider stack once the (possible) worker is ready.
void enableMocking().catch(() => undefined).then(() => {
  // Re-arm the token-refresh handler for a persisted session.
  useAuthStore.getState().bootstrap()
  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('Root element #root not found')

  createRoot(rootEl).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  )
})
