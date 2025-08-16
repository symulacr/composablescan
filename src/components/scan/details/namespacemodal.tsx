"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { Server, Hash, ExternalLink, Layers } from "lucide-react"
import { getNamespaceTransactions, formatBlockTime } from "@/services/api/espressoapi"
import { discoverLatestBlock } from "@/services/api/blockdiscovery"
import { getRollupName } from "@/services/api/rollupresolver"
import type { EspressoTransaction } from "@/types/espresso"

interface NamespaceModalProps {
  namespace: number | null
  isOpen: boolean
  onClose: () => void
}

export default function NamespaceModal({ namespace, isOpen, onClose }: NamespaceModalProps) {
  const [transactions, setTransactions] = useState<EspressoTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || namespace === null) {
      return
    }

    const fetchNamespaceData = async () => {
      setLoading(true)
      setError(null)
      
      try {

        const latestBlockHeight = await discoverLatestBlock()
        
        const namespaceData = await getNamespaceTransactions(latestBlockHeight, namespace)
        

        const txs = Array.isArray(namespaceData) ? namespaceData : 
                   (namespaceData.transactions || [])
        
        setTransactions(txs.slice(0, 10))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch namespace data')
      } finally {
        setLoading(false)
      }
    }

    fetchNamespaceData()
  }, [namespace, isOpen])

  const handleClose = () => {
    setTransactions([])
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  const rollupName = namespace !== null ? getRollupName(namespace) : null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-500" />
            Namespace {namespace} {rollupName && `(${rollupName})`}
          </DialogTitle>
          <DialogDescription>
            {rollupName 
              ? `Transactions and data for the ${rollupName} rollup`
              : `Transactions and data for namespace ${namespace}`
            }
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading namespace data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Error: {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-3">
                Namespace Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    Namespace ID: {namespace}
                  </span>
                </div>
                {rollupName && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      Rollup: {rollupName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    {transactions.length} recent transactions
                  </span>
                </div>
              </div>
            </div>

            {transactions.length > 0 ? (
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                  Recent Transactions
                </h3>
                <div className="space-y-2">
                  {transactions.map((tx, index) => (
                    <div 
                      key={tx.hash || index}
                      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => {

                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                            {tx.hash ? tx.hash.substring(0, 20) + '...' : 'No hash available'}
                          </code>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Block #{tx.block_height}</span>
                          <span>Index {tx.index}</span>
                          <span>{Math.round((tx.size || 0) / 1024)}KB</span>
                          {tx.timestamp && (
                            <span>{formatBlockTime(tx.timestamp)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {transactions.length === 10 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500">
                      Showing first 10 transactions • More available via API
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">
                  No recent transactions found for this namespace
                </p>
                {rollupName && (
                  <p className="text-gray-400 text-xs mt-1">
                    The {rollupName} rollup may not have recent activity
                  </p>
                )}
              </div>
            )}

            {rollupName && (
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Rollup Information
                </h3>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-800 dark:text-orange-200">
                      {rollupName}
                    </span>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    This namespace belongs to the {rollupName} rollup. All transactions 
                    in this namespace are related to {rollupName} operations.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  import('@/lib/config').then(({ getScanUrl }) => {
                    window.open(getScanUrl(`/namespace/${namespace}`), '_blank')
                  })
                }}
                className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View namespace on Espresso Scan
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}