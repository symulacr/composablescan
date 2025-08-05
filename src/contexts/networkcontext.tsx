"use client"

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { getCurrentNetwork } from '@/services/api/espressoapi'

interface NetworkContextType {
  currentNetwork: 'mainnet'
  networkInfo: {
    name: string
    apiBaseUrl: string
    apiVersion: string
    wsBaseUrl: string
    scanBaseUrl: string
    webWorkerUrl: string
  }
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

interface NetworkProviderProps {
  children: ReactNode
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const currentNetwork = 'mainnet'
  const networkInfo = getCurrentNetwork()

  useEffect(() => {
  }, [])

  return (
    <NetworkContext.Provider value={{
      currentNetwork,
      networkInfo
    }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}