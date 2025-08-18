"use client"

import { Wifi, WifiOff, Layers, Hash, HardDrive, CheckCircle } from "lucide-react"
import { formatNumber, formatBytes } from '@/services/api/main'

interface NetworkData {
  latestBlock: number
  totalTransactions: number
  totalPayloadSize: number
  successRate: number
  isConnected: boolean
}

interface LiveStatsProps {
  liveStreaming: boolean
  networkData: NetworkData
}

export default function LiveStats({ liveStreaming, networkData }: LiveStatsProps) {
  return (
    <div className="text-center space-y-6">
      <h1 className="text-5xl font-medium tracking-wide text-gray-900">COMPOSABLE SCAN</h1>
      <div className="flex items-center justify-center gap-x-4 text-sm text-gray-600 overflow-x-auto">
        <span className="flex items-center gap-1 whitespace-nowrap">
          {networkData.isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="font-mono">MAINNET</span>
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Layers className="w-4 h-4 text-gray-500" />
          <span className="font-mono">Block #{networkData.latestBlock}</span>
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <Hash className="w-4 h-4 text-gray-500" />
          <span className="font-mono">TXs: #{networkData.totalTransactions}</span>
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <HardDrive className="w-4 h-4 text-gray-500" />
          <span className="font-mono">Data: {formatBytes(networkData.totalPayloadSize)}</span>
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap">
          <CheckCircle className="w-4 h-4 text-gray-500" />
          <span className="font-mono">Success: {(networkData.successRate * 100).toFixed(2)}%</span>
        </span>
      </div>
    </div>
  )
}