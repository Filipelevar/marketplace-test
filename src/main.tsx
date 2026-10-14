import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { installHttpInterceptors } from '@/services/interceptors/auth-interceptor'
import '@/globals/index.css'

const FONT_WAIT_LIMIT_MS = 1500

installHttpInterceptors()

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

function waitForFonts() {
  const fontsLoaded = document.fonts.load('400 1em "Roboto Mono Variable"').catch(() => undefined)
  const limit = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_LIMIT_MS))
  return Promise.race([fontsLoaded, limit])
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

await Promise.all([enableMocking(), waitForFonts()])

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
