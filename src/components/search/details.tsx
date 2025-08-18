"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ExternalLink, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { formatBlockSize, formatBlockTime, getBlockTransactionsBatch } from '@/services/api/main'
import { getRollupName, getAllRollups } from '@/services/api/resolver'

interface Transaction {
  hash: string;
  index: number;
  namespace: number;
}

interface SearchResult {
  type: 'block' | 'transaction' | 'rollup' | 'namespace' | 'block_hash' | 'error' | 'loading'
  data: unknown
  query: string
  displayText?: string
}

interface SearchDetailsProps {
  selectedResults: SearchResult[]
}

const CopyButton = ({ text, label = "Copy" }: { text: string; label?: string }) => (
  <button 
    onClick={() => navigator.clipboard.writeText(text)}
    className="text-gray-400 hover:text-gray-600 transition-colors"
    title={`Copy ${label}`}
  >
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  </button>
)

export default function SearchDetails({ selectedResults }: SearchDetailsProps) {
  if (selectedResults.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {selectedResults.map((result, index) => (
        <div key={index} className="bg-white border border-gray-200 shadow-sm p-6">
          {(result.type === 'block' || result.type === 'block_hash') && (
            <BlockDetails result={result} />
          )}

          {result.type === 'transaction' && (
            <TransactionDetails result={result} />
          )}

          {result.type === 'namespace' && (
            <NamespaceDetails result={result} />
          )}

          {result.type === 'rollup' && (
            <RollupDetails result={result} />
          )}

          {result.type === 'error' && (
            <ErrorDetails result={result} />
          )}
        </div>
      ))}
    </motion.div>
  )
}

function BlockDetails({ result }: { result: SearchResult }) {
  const [showTransactions, setShowTransactions] = useState(false)
  const [batchState, setBatchState] = useState({
    loading: false,
    progress: 0,
    total: 0,
    transactions: [] as Transaction[],
    namespaces: new Set<number>(),
    error: null as string | null
  })
  const [activeFilter, setActiveFilter] = useState<number | null>(null)

  const blockHeight = (result.data as any)?.height || 0
  const numTransactions = (result.data as any)?.transactions || (result.data as any)?.num_transactions || 0

  const handleToggleTransactions = async () => {
    if (!showTransactions && batchState.transactions.length === 0 && numTransactions > 0) {
      setBatchState(prev => ({ ...prev, loading: true, error: null, progress: 0, total: 0 }))
      
      try {
        const blockTransactions = await getBlockTransactionsBatch(blockHeight)
        const namespaces = new Set(blockTransactions.map(tx => tx.namespace))
        
        setBatchState(prev => ({
          ...prev,
          loading: false,
          transactions: blockTransactions,
          namespaces,
          progress: 1,
          total: 1
        }))
      } catch (error) {
        setBatchState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to load transactions'
        }))
      }
    }
    setShowTransactions(!showTransactions)
  }

  const sortedTransactions = useMemo(() => {
    return batchState.transactions.sort((a, b) => a.index - b.index)
  }, [batchState.transactions])

  const filteredTransactions = activeFilter !== null 
    ? sortedTransactions.filter(tx => tx.namespace === activeFilter)
    : sortedTransactions

  const namespaceGroups = batchState.transactions.reduce((acc, tx) => {
    acc[tx.namespace] = (acc[tx.namespace] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const uniqueNamespaces = batchState.namespaces.size

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-gray-900">
        Block #{String(blockHeight || 'Unknown')}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-900 break-all">
            Hash: {(result.data as any)?.hash || 'N/A'}
          </span>
          <CopyButton text={(result.data as any)?.hash || ''} label="block hash" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <span className="text-gray-500">Height:</span>
          <span className="ml-2 font-mono text-gray-900">{blockHeight}</span>
        </div>
        <div>
          <span className="text-gray-500">Timestamp:</span>
          <span className="ml-2 font-mono text-gray-900">
            {new Date(((result.data as any)?.timestamp || 0) * 1000).toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Size:</span>
          <span className="ml-2 font-mono text-gray-900">
            {(result.data as any)?.human_readable_size || 
             ((result.data as any)?.size ? `${(result.data as any).size} bytes` : 'N/A')}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Fee:</span>
          <span className="ml-2 font-mono text-gray-900">
            {(result.data as any)?.fee_info?.amount 
              ? (parseInt((result.data as any).fee_info.amount, 10) / 1e18).toFixed(6)
              : '0.000000'
            }
          </span>
        </div>
      </div>

      {numTransactions > 0 && (
        <div>
          <button
            onClick={handleToggleTransactions}
            disabled={batchState.loading}
            className="flex items-center justify-between w-full text-sm text-gray-900 hover:text-gray-700 transition-colors disabled:opacity-50"
            aria-expanded={showTransactions}
            aria-controls="transaction-list"
          >
            <span>Transactions ({numTransactions}) {Array.from(' ').map((_, i) => (
              <span key={i} className="inline-block w-6 border-b border-gray-300 mx-1"></span>
            ))} {showTransactions ? '▼' : '▶'} Details</span>
          </button>

          {batchState.loading && (
            <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading transactions...
            </div>
          )}

          {showTransactions && (
            <motion.div
              id="transaction-list"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {batchState.error ? (
                <div className="text-red-600 text-sm">
                  Error loading transactions: {batchState.error}
                </div>
              ) : batchState.transactions.length > 0 ? (
                <div className="space-y-3">
                  {batchState.namespaces.size > 1 && (
                    <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
                      <button
                        onClick={() => setActiveFilter(null)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          activeFilter === null 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        All
                      </button>
                      {Array.from(batchState.namespaces).sort((a, b) => a - b).map(ns => (
                        <button
                          key={ns}
                          onClick={() => setActiveFilter(ns)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            activeFilter === ns 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {(() => {
                            const rollupName = getRollupName(ns)
                            return rollupName ? `${rollupName} (${namespaceGroups[ns]})` : `NS: ${ns} (${namespaceGroups[ns]})`
                          })()}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredTransactions.length === 0 && !batchState.loading ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No transactions found in this block
                      </div>
                    ) : (
                      filteredTransactions.map((tx, index) => (
                        <div key={index} className="flex items-center gap-3 py-2 text-sm border-b border-gray-100 last:border-b-0">
                          <span className="text-gray-500 font-mono">#{tx.index}:</span>
                          <span className="font-mono text-xs text-gray-900 flex-1 min-w-0 truncate">
                            {tx.hash.startsWith('TX~') ? tx.hash : `TX~${tx.hash}`}
                          </span>
                          <CopyButton text={tx.hash} label="transaction hash" />
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-900">
                            {(() => {
                              const rollupName = getRollupName(tx.namespace)
                              return rollupName ? `${rollupName} (${tx.namespace})` : tx.namespace
                            })()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="text-sm text-gray-600 pt-2">
                    {activeFilter !== null ? (
                      <>Showing {filteredTransactions.length} transactions from {(() => {
                        const rollupName = getRollupName(activeFilter)
                        return rollupName ? `${rollupName} (${activeFilter})` : `namespace ${activeFilter}`
                      })()}</>
                    ) : (
                      <>{uniqueNamespaces} {uniqueNamespaces === 1 ? 'namespace' : 'namespaces'}, {batchState.transactions.length} total transactions</>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No transaction data available</div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

function TransactionDetails({ result }: { result: SearchResult }) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="md:col-span-2">
          <span className="text-gray-500">Transaction Hash:</span>
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs text-gray-900 flex-1">{result.query}</div>
            <CopyButton text={result.query} label="transaction hash" />
          </div>
        </div>
        {result.data && typeof result.data === 'object' && 'transaction' in result.data ? (
          <>
            {(result.data as any).transaction?.namespace !== undefined && (
              <div>
                <span className="text-gray-500">Namespace:</span>
                <div className="font-mono text-gray-900">
                  {(() => {
                    const namespace = (result.data as any).transaction.namespace
                    const rollupName = getRollupName(namespace)
                    return rollupName ? `${namespace} (${rollupName})` : namespace
                  })()}
                </div>
              </div>
            )}
            <div>
              <span className="text-gray-500">Size (bytes):</span>
              <div className="font-mono text-gray-900">{(result.data as any).transaction?.tx_size_bytes ? formatBlockSize((result.data as any).transaction.tx_size_bytes) : 'Unknown'}</div>
            </div>
            <div>
              <span className="text-gray-500">Block Height:</span>
              <div className="font-mono text-gray-900">{(result.data as any).transaction?.block_height || 'Unknown'}</div>
            </div>
            {(result.data as any).transaction?.block_hash && (
              <div className="md:col-span-2">
                <span className="text-gray-500">Block Hash:</span>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs text-gray-900 flex-1">{(result.data as any).transaction.block_hash}</div>
                  <CopyButton text={(result.data as any).transaction.block_hash} label="block hash" />
                </div>
              </div>
            )}
            {(result.data as any).transaction?.timestamp && (
              <div>
                <span className="text-gray-500">Timestamp:</span>
                <div className="font-mono text-gray-900">{(result.data as any).transaction.timestamp ? formatBlockTime((result.data as any).transaction.timestamp) : 'Unknown'}</div>
              </div>
            )}
            {(result.data as any).transaction?.human_readable_time && (
              <div>
                <span className="text-gray-500">Time Ago:</span>
                <div className="font-mono text-gray-900">{(result.data as any).transaction.human_readable_time}</div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

function NamespaceDetails({ result }: { result: SearchResult }) {
  const namespaceId = parseInt(result.query)

  const rollupData = getAllRollups().find(rollup => rollup.namespace === namespaceId)
  
  if (rollupData) {

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{rollupData.name}</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-gray-500">Namespace:</span>
            <div className="font-mono text-gray-900">{rollupData.namespace}</div>
          </div>
          <div>
            <span className="text-gray-500">Website:</span>
            <div>
              <a 
                href={rollupData.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {rollupData.website}
              </a>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Scan:</span>
            <div>
              <a 
                href={rollupData.scan} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {rollupData.scan}
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  } else {

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Namespace #{result.query}</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Namespace ID:</span>
            <div className="font-mono text-gray-900">{result.query}</div>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <div className="text-gray-900">No associated rollup found</div>
          </div>
        </div>
      </div>
    )
  }
}

function RollupDetails({ result }: { result: SearchResult }) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Rollup Search Results</h3>
      {Array.isArray(result.data) && (result.data as any[]).length > 0 ? (
        <div className="space-y-4">
          {(result.data as any[]).map((rollup, rollupIndex) => (
            <div key={rollupIndex} className="border-l-4 border-blue-400 pl-4">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <div className="font-medium text-gray-900">{rollup.name}</div>
                </div>
                <div>
                  <span className="text-gray-500">Namespace:</span>
                  <div className="font-mono text-gray-900">{rollup.namespace}</div>
                </div>
                <div>
                  <span className="text-gray-500">Website:</span>
                  <div>
                    <a 
                      href={rollup.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      {rollup.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Scan:</span>
                  <div>
                    <a 
                      href={rollup.scan} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      {rollup.scan}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No rollups found for "{result.query}"</div>
      )}
    </div>
  )
}

function ErrorDetails({ result }: { result: SearchResult }) {
  return (
    <div>
      <h3 className="text-lg font-medium text-red-600 mb-4">Search Error</h3>
      <div className="text-sm text-red-500">
        {(result.data as any)?.error}
      </div>
    </div>
  )
}