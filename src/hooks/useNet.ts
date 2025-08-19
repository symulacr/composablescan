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

  const fetchNetworkStats = async () => {
    try {
      const [totalTxns, totalPayload, successRate] = await Promise.all([
        getTotalTransactions(),
        getTotalPayloadSize(), 
        getSuccessRate()
      ])
      
      setChainData(prev => ({
        ...prev,
        totalTransactions: totalTxns,
        totalPayloadSize: totalPayload,
        successRate: successRate
      }))
    } catch (error) {
      // Keep previous values on error
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
        fetchNetworkStats()
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
      await stream.connect()
    }
    
    initializeStream()
    
    return () => {
      stream.disconnect()
    }
  }, [])

  useEffect(() => {
    fetchNetworkStats()
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