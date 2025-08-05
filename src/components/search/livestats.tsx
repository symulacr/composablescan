"use client"

import { Wifi, WifiOff, Clock, Layers, TrendingUp } from "lucide-react"
import { formatNumber } from '@/services/api/espressoapi'

interface NetworkData {
  latestBlock: number
  totalTransactions: number
  avgBlockTime: number
  isConnected: boolean
}

interface LiveStatsProps {
  liveStreaming: boolean
  networkData: NetworkData
}

export default function LiveStats({ liveStreaming, networkData }: LiveStatsProps) {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-4xl font-light tracking-wide text-gray-900">Composable Scan</h1>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          {liveStreaming && networkData.isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="font-mono">MAINNET</span>
          {liveStreaming && (
            <span className="text-xs text-green-600 bg-green-50 px-1 rounded">LIVE</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Layers className="w-4 h-4 text-gray-500" />
          <span className="font-mono">Block #{networkData.latestBlock}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className="font-mono">{formatNumber(networkData.totalTransactions)} Avg Txns/Block</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="font-mono">
            {networkData.avgBlockTime > 0 ? `${networkData.avgBlockTime}s` : 'Unknown'} Avg. Block Time
          </span>
        </div>
      </div>
    </div>
  )
}