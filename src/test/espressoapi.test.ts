import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getBlock, getTransactionByHash, formatBlockTime, formatTransactionHash } from '@/services/api/espressoapi'


const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EspressoAPI', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('getBlock', () => {
    it('should fetch block data successfully', async () => {
      const mockBlockData = {
        height: 123456,
        timestamp: 1642680000,
        transactions: 5,
        hash: 'block-hash-123'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData
      })

      const result = await getBlock(123456)
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/availability/block/123456'),
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      )
      expect(result).toEqual(mockBlockData)
    })

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(getBlock(999999)).rejects.toThrow('HTTP 404: Not Found')
    })
  })

  describe('getTransactionByHash', () => {
    it('should fetch transaction data successfully', async () => {
      const mockTxData = {
        hash: 'TX~abc123',
        block_height: 123456,
        index: 0,
        size: 500,
        namespace: 360
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTxData
      })

      const result = await getTransactionByHash('TX~abc123')
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/availability/transaction/hash/TX~abc123'),
        expect.objectContaining({
          method: 'GET'
        })
      )
      expect(result).toEqual(mockTxData)
    })

    it('should handle TX~ prefix correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hash: 'TX~test' })
      })

      await getTransactionByHash('test')
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/transaction/hash/TX~test'),
        expect.any(Object)
      )
    })
  })

  describe('formatBlockTime', () => {
    it('should format recent timestamps correctly', () => {
      const now = Date.now()
      const oneMinuteAgo = Math.floor(now / 1000) - 60
      
      expect(formatBlockTime(oneMinuteAgo)).toBe('1 min ago')
    })

    it('should format older timestamps correctly', () => {
      const now = Date.now()
      const twoHoursAgo = Math.floor(now / 1000) - (2 * 60 * 60)
      
      expect(formatBlockTime(twoHoursAgo)).toBe('2h ago')
    })

    it('should handle "Just now" case', () => {
      const now = Math.floor(Date.now() / 1000)
      
      expect(formatBlockTime(now)).toBe('Just now')
    })
  })

  describe('formatTransactionHash', () => {
    it('should truncate long hashes', () => {
      const longHash = 'TX~abcdefghijklmnopqrstuvwxyz123456789'
      const result = formatTransactionHash(longHash, 10)
      
      expect(result).toBe('TX~abcdefg...')
    })

    it('should return short hashes unchanged', () => {
      const shortHash = 'TX~abc'
      const result = formatTransactionHash(shortHash, 10)
      
      expect(result).toBe('TX~abc')
    })
  })
})