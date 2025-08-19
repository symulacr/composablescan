"use client"
import { createContext, useContext, ReactNode } from 'react'
import { getCurrentNetwork } from '@/services/api/main'
interface NetCtx {
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

const NetContext = createContext<NetCtx | undefined>(undefined)

interface NetProviderProps {
  children: ReactNode
}

export function NetworkProvider({ children }: NetProviderProps) {
  const currentNetwork = 'mainnet'
  const networkInfo = getCurrentNetwork()

  return (
    <NetContext.Provider value={{
      currentNetwork,
      networkInfo
    }}>
      {children}
    </NetContext.Provider>
  )
}

export function useNetwork() {
  const context = useContext(NetContext)
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}