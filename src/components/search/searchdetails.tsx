"use client"

import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import { formatTransactionSize, formatTransactionTimestamp } from '@/services/api/espressoapi'
import { getRollupName, getAllRollups } from '@/services/api/rollupresolver'

interface SearchResult {
  type: 'block' | 'transaction' | 'rollup' | 'namespace' | 'block_hash' | 'error' | 'loading'
  data: unknown
  query: string
  displayText?: string
}

interface SearchDetailsProps {
  selectedResults: SearchResult[]
}

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
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Block #{String((result.data as Record<string, unknown>)?.height || 'Unknown')}
        {result.type === 'block_hash' && <span className="text-sm text-gray-500 ml-2">(by hash)</span>}
      </h3>
      <div className="space-y-4 text-sm">
        {/* Line 1: Hash + Block Height */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <span className="text-gray-500">Block Hash:</span>
            <div className="flex items-center gap-2">
              <div className="font-mono text-xs text-gray-900 flex-1">{(result.data as any)?.hash || 'N/A'}</div>
              <button 
                onClick={() => navigator.clipboard.writeText((result.data as any)?.hash || '')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy hash"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 002 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Block Height:</span>
            <div className="font-mono text-gray-900">{(result.data as any)?.height || 0}</div>
          </div>
        </div>
        
        {/* Line 2: Timestamp + Number of Transactions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500">Timestamp:</span>
            <div className="font-mono text-gray-900">{new Date(((result.data as any)?.timestamp || 0) * 1000).toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-500">Number of Transactions:</span>
            <div className="font-mono text-gray-900">{(result.data as any)?.transactions || (result.data as any)?.num_transactions || 0}</div>
          </div>
        </div>
        
        {/* Line 3: Block Size + Block Fee */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500">Block Size:</span>
            <div className="font-mono text-gray-900">
              {(result.data as any)?.human_readable_size || 
               ((result.data as any)?.size ? `${(result.data as any).size} bytes` : 'N/A')}
            </div>
          </div>
          {(result.data as any)?.fee_info?.amount && (
            <div>
              <span className="text-gray-500">Block Fee:</span>
              <div className="font-mono text-gray-900">
                {(parseInt((result.data as any).fee_info.amount, 10) / 1e18).toFixed(6)}
              </div>
            </div>
          )}
        </div>
      </div>
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
            <button 
              onClick={() => navigator.clipboard.writeText(result.query)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy hash"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
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
              <div className="font-mono text-gray-900">{formatTransactionSize((result.data as any).transaction?.tx_size_bytes)}</div>
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
                  <button 
                    onClick={() => navigator.clipboard.writeText((result.data as any).transaction.block_hash)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy hash"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {(result.data as any).transaction?.timestamp && (
              <div>
                <span className="text-gray-500">Timestamp:</span>
                <div className="font-mono text-gray-900">{formatTransactionTimestamp((result.data as any).transaction.timestamp)}</div>
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