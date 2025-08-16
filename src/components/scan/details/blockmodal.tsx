"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { Layers, Clock, Hash, Users, Zap, ExternalLink } from "lucide-react"
import { getBlock, formatBlockSize } from "@/services/api/espressoapi"
import type { EspressoBlock } from "@/types/espresso"

interface BlockModalProps {
  blockHeight: number | null
  isOpen: boolean
  onClose: () => void
}

export default function BlockModal({ blockHeight, isOpen, onClose }: BlockModalProps) {
  const [block, setBlock] = useState<EspressoBlock | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || blockHeight === null) {
      return
    }

    const fetchBlock = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const blockData = await getBlock(blockHeight)
        setBlock(blockData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch block')
      } finally {
        setLoading(false)
      }
    }

    fetchBlock()
  }, [blockHeight, isOpen])

  const handleClose = () => {
    setBlock(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-green-500" />
            Block #{blockHeight}
          </DialogTitle>
          <DialogDescription>
            Detailed information about this block on the Espresso Network
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading block data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Error: {error}
            </p>
          </div>
        )}

        {block && !loading && !error && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                Block Overview
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Block Hash
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Block #{blockHeight}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(block.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {block.transactions || 0} transactions
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {block.size && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatBlockSize(block.size)}
                      </span>
                    </div>
                  )}
                  {(block.block_reward && block.block_reward.length > 0) && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Fee: {block.block_reward[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {block.hash && (
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Block Hash
                </h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <code className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-nowrap">
                    {block.hash}
                  </code>
                </div>
              </div>
            )}


            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                Timestamps
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Unix Timestamp:</span>
                  <code className="font-mono text-gray-700 dark:text-gray-300">
                    {block.timestamp}
                  </code>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Human Readable:</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(block.timestamp * 1000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  import('@/lib/config').then(({ getScanUrl }) => {
                    window.open(getScanUrl(`/block/${blockHeight}`), '_blank')
                  })
                }}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View on Espresso Scan
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}