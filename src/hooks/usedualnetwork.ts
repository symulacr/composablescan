"use client"


import { useState, useEffect } from 'react'
import { subscribeToMainnetSync, getMainnetState, startMainnetSync } from '@/services/api/mainnetsyncsimple'

interface BlockData {
  height: number
  timestamp: number
  transactions: number
  hash?: string
}

interface NetworkData {
  latestBlock: number
  recentBlocks: BlockData[]
  lastUpdated: number
  isConnected: boolean
  avgBlockTime: number
}


interface MainnetOnlyData {
  mainnet: NetworkData
}

export function useDualNetworkData() {
  const [networkData, setNetworkData] = useState<MainnetOnlyData>(() => ({
    mainnet: getMainnetState()
  }))

  useEffect(() => {

    startMainnetSync()


    const unsubscribe = subscribeToMainnetSync((mainnetState) => {
      setNetworkData({ mainnet: mainnetState })
    })

    return unsubscribe
  }, [])

  return networkData
}


export function useNetworkData() {
  const data = useDualNetworkData()
  return data.mainnet
}