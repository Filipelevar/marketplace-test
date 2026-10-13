import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export function startMockWorker() {
  return worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
}
