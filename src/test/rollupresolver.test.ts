import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveRollupName, getRollupName } from '@/services/api/resolver'


const mockFetch = vi.fn()
global.fetch = mockFetch

describe('RollupResolver', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('resolveRollupName', () => {
    it('should resolve known rollup names', () => {

      const namespace = resolveRollupName('MOLTEN')
      expect(namespace).toBe(360)
    })

    it('should return null for unknown rollup names', () => {
      const namespace = resolveRollupName('UNKNOWN_ROLLUP')
      expect(namespace).toBeNull()
    })

    it('should be case insensitive', () => {
      const namespace1 = resolveRollupName('molten')
      const namespace2 = resolveRollupName('MOLTEN')
      const namespace3 = resolveRollupName('Molten')
      
      expect(namespace1).toBe(360)
      expect(namespace2).toBe(360)
      expect(namespace3).toBe(360)
    })
  })

  describe('getRollupName', () => {
    it('should return rollup name for known namespace', () => {
      const name = getRollupName(360)
      expect(name).toBe('MOLTEN')
    })

    it('should return null for unknown namespace', () => {
      const name = getRollupName(99999)
      expect(name).toBeNull()
    })
  })
})