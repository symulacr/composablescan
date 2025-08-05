import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll } from 'vitest'


if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  })
}


(global as unknown as Record<string, unknown>).WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))


global.fetch = vi.fn()



beforeAll(() => {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
})