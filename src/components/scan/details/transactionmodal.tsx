"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { Hash, Layers, Server, Clock, ExternalLink, ArrowRight } from "lucide-react"
import { getTransactionByHash, formatBlockTime } from "@/services/api/espressoapi"
import { getRollupName } from "@/services/api/rollupresolver"
import type { EspressoTransaction } from "@/types/espresso"

interface TransactionModalProps {
  transactionHash: string | null
  isOpen: boolean
  onClose: () => void
}

export default function TransactionModal({ transactionHash, isOpen, onClose }: TransactionModalProps) {
  const [transaction, setTransaction] = useState<EspressoTransaction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !transactionHash) {
      return
    }

    const fetchTransaction = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const txData = await getTransactionByHash(transactionHash)
        setTransaction(txData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transaction')
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [transactionHash, isOpen])

  const handleClose = () => {
    setTransaction(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  const rollupName = transaction ? getRollupName(transaction.namespace || 0) : null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-blue-500" />
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about this transaction on the Espresso Network
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading transaction data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Error: {error}
            </p>
          </div>
        )}

        {transaction && !loading && !error && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">
                Transaction Overview
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Block #{transaction.block_height}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Namespace {transaction.namespace}
                    {rollupName && (
                      <span className="ml-1 text-orange-600 dark:text-orange-400">
                        ({rollupName})
                      </span>
                    )}
                  </span>
                </div>
                {transaction.timestamp && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatBlockTime(transaction.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                Transaction Hash
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <code className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-nowrap">
                  {transaction.hash}
                </code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                Transaction Size
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded p-3">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {transaction.size ? transaction.size.toLocaleString() : '0'} bytes
                </span>
              </div>
            </div>

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
                    This transaction was submitted to namespace {transaction.namespace}, 
                    which belongs to the {rollupName} rollup.
                  </p>
                </div>
              </div>
            )}

            {transaction.sender && (
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Sender
                </h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-3">
                  <code className="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-nowrap">
                    {transaction.sender}
                  </code>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                Block Information
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Block #{transaction.block_height}
                  </span>
                </div>
                <button
                  onClick={() => {

                  }}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  View Block
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {transaction.timestamp && (
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Timestamps
                </h3>
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Unix Timestamp:</span>
                    <code className="font-mono text-gray-700 dark:text-gray-300">
                      {transaction.timestamp}
                    </code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Human Readable:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {transaction.timestamp ? new Date(transaction.timestamp * 1000).toLocaleString() : 'No timestamp available'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  import('@/lib/config').then(({ getScanUrl }) => {
                    window.open(getScanUrl(`/transaction/${transaction.hash}`), '_blank')
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