"use client"

import { motion, AnimatePresence } from "framer-motion"
import { formatNumber, formatTransactionSize } from '@/services/api/espressoapi'
import { getRollupName, getAllRollups } from '@/services/api/rollupresolver'
import { StreamingBlock } from '@/services/websocket/espressostream'

interface SearchResult {
  type: 'block' | 'transaction' | 'rollup' | 'namespace' | 'block_hash' | 'error' | 'loading'
  data: unknown
  query: string
  displayText?: string
}

interface SearchResultsProps {
  isActive: boolean
  liveResults: SearchResult[]
  isSearching: boolean
  liveStreaming: boolean
  query: string
  streamingBlocks: StreamingBlock[]
  onResultSelect: (result: SearchResult) => void
  onStreamingBlockSelect: (height: number) => void
}

export default function SearchResults({
  isActive,
  liveResults,
  isSearching,
  liveStreaming,
  query,
  streamingBlocks,
  onResultSelect,
  onStreamingBlockSelect
}: SearchResultsProps) {
  return (
    <AnimatePresence>
      {isActive && (liveResults.length > 0 || isSearching) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-lg z-10 max-h-96 overflow-y-auto"
        >
          <div className="p-4 space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
              Live Search Results
              {liveStreaming && (
                <span className="text-xs text-green-600 bg-green-50 px-1 rounded flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  STREAMING
                </span>
              )}
            </div>
            
            {/* Show live streaming blocks when no search query */}
            {!query.trim() && streamingBlocks.length > 0 && (
              <div className="space-y-1 border-b border-gray-100 pb-2 mb-2">
                {streamingBlocks.slice(0, 3).map((block, index) => (
                  <button
                    key={`stream-${block.height}`}
                    className="w-full text-left p-2 hover:bg-blue-50 text-sm rounded border border-blue-100"
                    onClick={() => onStreamingBlockSelect(block.height)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        live
                      </span>
                      <span className="font-medium text-gray-900">Block #{formatNumber(block.height)}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{block.transactions} txs</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{block.size ? `${block.size} bytes` : 'Unknown size'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1">
              {isSearching && liveResults.length === 0 && (
                <div className="p-3 text-sm text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Searching...
                </div>
              )}
              {liveResults.map((result, index) => (
                <SearchResultItem 
                  key={index} 
                  result={result} 
                  onSelect={onResultSelect}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SearchResultItem({ result, onSelect }: { result: SearchResult; onSelect: (result: SearchResult) => void }) {
  return (
    <button
      className="w-full text-left p-3 hover:bg-gray-50 text-sm rounded border border-gray-100"
      onClick={() => onSelect(result)}
      disabled={result.type === 'loading' || result.type === 'error'}
    >
      {result.type === 'loading' && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          <span>Searching...</span>
        </div>
      )}
      
      {result.type === 'error' && (
        <div className="text-red-500">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">error</span>
            <span className="text-xs">{(result.data as any)?.error}</span>
          </div>
        </div>
      )}

      {(result.type === 'block' || result.type === 'block_hash') && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
              {result.type === 'block' ? 'block' : 'block hash'}
            </span>
            <span className="font-medium text-gray-900">Block #{(result.data as any)?.height || 0}</span>
            {result.displayText?.includes('(LIVE)') && (
              <span className="px-1 py-0.5 text-xs rounded bg-green-100 text-green-700 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                LIVE
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Hash: {(result.data as any)?.hash ? `${(result.data as any).hash.substring(0, 20)}...` : 'N/A'}</div>
            <div>Transactions: {(result.data as any)?.transactions || (result.data as any)?.num_transactions || 0}</div>
            <div>Size: {(result.data as any)?.human_readable_size || ((result.data as any)?.size ? `${(result.data as any).size} bytes` : 'N/A')}</div>
            <div>Time: {(result.data as any)?.human_readable_time || new Date(((result.data as any)?.timestamp || 0) * 1000).toLocaleDateString()}</div>
          </div>
        </div>
      )}

      {result.type === 'transaction' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">transaction</span>
            <span className="font-medium text-gray-900">Transaction</span>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Hash: {result.query.substring(0, 20)}...</div>
            {result.data && typeof result.data === 'object' && 'transaction' in result.data ? (
              <>
                {(result.data as any).transaction?.namespace !== undefined && (
                  <div>
                    Namespace: {(() => {
                      const namespace = (result.data as any).transaction.namespace
                      const rollupName = getRollupName(namespace)
                      return rollupName ? `${namespace} (${rollupName})` : namespace
                    })()}
                  </div>
                )}
                <div>Block: #{(result.data as any).transaction?.block_height || 'Unknown'}</div>
                {(result.data as any).transaction?.tx_size_bytes && (
                  <div>Size: {formatTransactionSize((result.data as any).transaction.tx_size_bytes)}</div>
                )}
                {(result.data as any).transaction?.human_readable_time && (
                  <div>Time: {(result.data as any).transaction.human_readable_time}</div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {result.type === 'namespace' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700">rollup</span>
            <span className="font-medium text-gray-900">
              {(() => {
                const namespaceId = parseInt(result.query)
                const rollupName = getRollupName(namespaceId)
                return rollupName || `Namespace #${result.query}`
              })()}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Namespace: {result.query}</div>
            {(() => {
              const namespaceId = parseInt(result.query)
              const rollupData = getAllRollups().find(rollup => rollup.namespace === namespaceId)
              return rollupData ? (
                <div>Website: {rollupData.website}</div>
              ) : null
            })()}
          </div>
        </div>
      )}

      {result.type === 'rollup' && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">rollup</span>
            <span className="font-medium text-gray-900">
              {Array.isArray(result.data) && (result.data as any[]).length > 0 ? (result.data as any[])[0].name : result.query}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {Array.isArray(result.data) && (result.data as any[]).length > 0 ? (
              <div className="space-y-1">
                <div>Namespace: {(result.data as any[])[0].namespace}</div>
                <div>Found {(result.data as any[]).length} rollup{(result.data as any[]).length > 1 ? 's' : ''}</div>
              </div>
            ) : (
              <div>No rollups found</div>
            )}
          </div>
        </div>
      )}
    </button>
  )
}