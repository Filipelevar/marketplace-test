import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installHttpInterceptors } from '@/services/interceptors/auth-interceptor'
import '@/globals/index.css'

installHttpInterceptors()

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

await enableMocking()

const { App } = await import('@/App')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
