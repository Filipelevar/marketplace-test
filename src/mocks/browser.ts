import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export function startMockWorker() {
  // Assets, fonts and Vite internals pass through; /api/* is fully covered by the handlers
  return worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
}
