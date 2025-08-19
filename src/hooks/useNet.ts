"use client"
import { useState, useEffect, useRef } from 'react'
import { getBlockStream } from '@/services/ws/stream'
import type { StreamingBlock, StreamingStats } from '@/services/ws/stream'
import { getTotalTransactions, getTotalPayloadSize, getSuccessRate } from '@/services/api/discovery'
interface Block {
  height: number
  timestamp: number
  transactions: number
  hash?: string
}

interface ChainData {
  latestBlock: number
  recentBlocks: Block[]
  lastUpdated: number
  isConnected: boolean
  avgBlockTime: number
  totalTransactions: number
  totalPayloadSize: number
  successRate: number
}

export function useNetData() {
  const [chainData, setChainData] = useState<ChainData>(() => ({
    latestBlock: 0,
    recentBlocks: [],
    lastUpdated: 0,
    isConnected: false,
    avgBlockTime: 0,
    totalTransactions: 0,
    totalPayloadSize: 0,
    successRate: 0
  }))
  const lastStatsUpdateBlock = useRef(0)

  const fetchTransactionCount = async () => {
    try {
      const totalTxns = await getTotalTransactions()
      setChainData(prev => ({
        ...prev,
        totalTransactions: totalTxns
      }))
    } catch (error) {
    }
  }

  const fetchDataAndSuccess = async () => {
    try {
      const [totalPayload, successRate] = await Promise.all([
        getTotalPayloadSize(), 
        getSuccessRate()
      ])
      
      setChainData(prev => ({
        ...prev,
        totalPayloadSize: totalPayload,
        successRate: successRate
      }))
    } catch (error) {
    }
  }

  useEffect(() => {
    const stream = getBlockStream()
    
    const handleBlock = (block: StreamingBlock) => {
      const blockData: Block = {
        height: block.height,
        timestamp: block.timestamp,
        transactions: block.transactions,
        hash: block.hash
      }
      
      setChainData(prev => ({
        ...prev,
        latestBlock: block.height,
        recentBlocks: [blockData, ...prev.recentBlocks].slice(0, 13),
        lastUpdated: Date.now(),
        isConnected: true
      }))

      if (block.height - lastStatsUpdateBlock.current >= 5) {
        lastStatsUpdateBlock.current = block.height
        fetchTransactionCount()
      }
    }
    
    const handleStats = (stats: StreamingStats) => {
      setChainData(prev => ({
        ...prev,
        avgBlockTime: stats.avgBlockTime,
        isConnected: true
      }))
    }
    
    const handleError = () => {
      setChainData(prev => ({
        ...prev,
        isConnected: false
      }))
    }
    
    stream.onBlock(handleBlock)
    stream.onStats(handleStats)
    stream.onError(handleError)
    
    const initializeStream = async () => {
      try {
        await stream.connect()
      } catch (error) {
      }
    }
    
    initializeStream()
    
    return () => {
      stream.disconnect()
    }
  }, [])

  useEffect(() => {
    fetchTransactionCount()
    fetchDataAndSuccess()
    
    const interval = setInterval(fetchDataAndSuccess, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return chainData
}

export function useDualNetworkData() {
  const chainData = useNetData()
  return { mainnet: chainData }
}

export function useNetworkData() {
  return useNetData()
}