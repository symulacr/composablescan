"use client"
import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Loader2 } from "lucide-react"
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

// Foundation component interfaces
interface DetailHeaderProps {
  children: React.ReactNode
  variant?: 'default' | 'error'
}

interface FieldRowProps {
  label: string
  value: string | React.ReactNode
  copyable?: string
  className?: string
}

interface HashDisplayProps {
  label: string
  hash: string
  className?: string
}

interface InfoGridProps {
  children: React.ReactNode
  className?: string
}

interface ExternalLinkProps {
  href: string
  children: React.ReactNode
  className?: string
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

// Foundation Components
const DetailHeader = ({ children, variant = 'default' }: DetailHeaderProps) => (
  <h3 className={`text-lg font-medium mb-4 ${
    variant === 'error' ? 'text-red-600' : 'text-gray-900'
  }`}>{children}</h3>
)

const FieldRow = ({ label, value, copyable, className = "" }: FieldRowProps) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span className="text-gray-500">{label}:</span>
    <span className="ml-3 font-mono text-sm text-gray-900">{value}</span>
    {copyable && <CopyButton text={copyable} label={label.toLowerCase()} />}
  </div>
)

const HashDisplay = ({ label, hash, className = "" }: HashDisplayProps) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span className="text-gray-500">{label}:</span>
    <span className="ml-3 font-mono text-sm text-gray-900 break-all">{hash}</span>
    <CopyButton text={hash} label={label.toLowerCase()} />
  </div>
)

const InfoGrid = ({ children, className = "" }: InfoGridProps) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${className}`}>
    {children}
  </div>
)

const ExternalLinkComponent = ({ href, children, className = "" }: ExternalLinkProps) => (
  <a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`text-blue-600 hover:text-blue-800 underline flex items-center gap-1 ${className}`}
  >
    {children}
    <ExternalLink className="w-3 h-3" />
  </a>
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
      <DetailHeader>
        Block #{String(blockHeight || 'Unknown')}
      </DetailHeader>

      <HashDisplay 
        label="Hash" 
        hash={(result.data as any)?.hash || 'N/A'}
      />

      <InfoGrid>
        <FieldRow 
          label="Height" 
          value={blockHeight.toString()}
        />
        <FieldRow 
          label="Timestamp" 
          value={new Date(((result.data as any)?.timestamp || 0) * 1000).toLocaleString()}
        />
        <FieldRow 
          label="Size" 
          value={(result.data as any)?.human_readable_size || 
                 ((result.data as any)?.size ? `${(result.data as any).size} bytes` : 'N/A')}
        />
        <FieldRow 
          label="Fee" 
          value={`${(result.data as any)?.fee_info?.amount 
            ? (parseInt((result.data as any).fee_info.amount, 10) / 1e18).toFixed(6)
            : '0.000000'
          } ETH`}
        />
      </InfoGrid>

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
  // Type guards and data extraction
  const hasTransactionData = result.data && typeof result.data === 'object' && 'transaction' in result.data
  const transactionData = hasTransactionData ? (result.data as any) : null
  const transaction = transactionData?.transaction
  
  // Extract values with proper fallbacks
  const getTransactionIndex = () => {
    if (transactionData?.index !== undefined) return transactionData.index
    if (transaction?.index !== undefined) return transaction.index
    return '?'
  }
  
  const getNamespaceDisplay = () => {
    if (transaction?.namespace === undefined) return null
    const namespace = transaction.namespace
    const rollupName = getRollupName(namespace)
    return rollupName ? `${namespace} (${rollupName})` : namespace
  }

  return (
    <div className="space-y-4">
      <DetailHeader>Transaction Details</DetailHeader>
      
      <div className="space-y-4">
        <HashDisplay 
          label="Transaction Hash" 
          hash={result.query}
        />
        
        {hasTransactionData ? (
          <>
            <InfoGrid>
              <FieldRow 
                label="Size" 
                value={transaction?.tx_size_bytes ? formatBlockSize(transaction.tx_size_bytes) : 'Unknown'}
              />
              <FieldRow 
                label="Block Height" 
                value={transactionData.block_height || 'Unknown'}
              />
              <FieldRow 
                label="Index" 
                value={`#${getTransactionIndex()}`}
              />
              {transaction?.namespace !== undefined && (
                <FieldRow 
                  label="Namespace" 
                  value={getNamespaceDisplay() || 'Unknown'}
                />
              )}
            </InfoGrid>
            
            {transaction?.block_hash && (
              <HashDisplay 
                label="Block Hash" 
                hash={transaction.block_hash}
              />
            )}
            
            {transaction?.timestamp && (
              <FieldRow 
                label="Timestamp" 
                value={formatBlockTime(transaction.timestamp) || 'Unknown'}
              />
            )}
            
            {transaction?.human_readable_time && (
              <FieldRow 
                label="Time Ago" 
                value={transaction.human_readable_time}
              />
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
      <div className="space-y-4">
        <DetailHeader>{rollupData.name}</DetailHeader>
        
        <InfoGrid>
          <FieldRow 
            label="Namespace" 
            value={rollupData.namespace.toString()}
          />
          <FieldRow 
            label="Website" 
            value={<ExternalLinkComponent href={rollupData.website} className="break-all">{rollupData.website}</ExternalLinkComponent>}
          />
          <FieldRow 
            label="Scan" 
            value={<ExternalLinkComponent href={rollupData.scan} className="break-all">{rollupData.scan}</ExternalLinkComponent>}
          />
        </InfoGrid>
      </div>
    )
  } else {
    return (
      <div className="space-y-4">
        <DetailHeader>Namespace #{result.query}</DetailHeader>
        
        <InfoGrid>
          <FieldRow 
            label="Namespace ID" 
            value={result.query}
          />
          <FieldRow 
            label="Status" 
            value="No associated rollup found"
          />
        </InfoGrid>
      </div>
    )
  }
}

function RollupDetails({ result }: { result: SearchResult }) {
  return (
    <div className="space-y-4">
      <DetailHeader>Rollup Search Results</DetailHeader>
      
      {Array.isArray(result.data) && (result.data as any[]).length > 0 ? (
        <div className="space-y-4">
          {(result.data as any[]).map((rollup, rollupIndex) => (
            <div key={rollupIndex} className="border-l-4 border-blue-400 pl-4">
              <InfoGrid>
                <FieldRow 
                  label="Name" 
                  value={rollup.name}
                />
                <FieldRow 
                  label="Namespace" 
                  value={rollup.namespace}
                />
                <FieldRow 
                  label="Website" 
                  value={<ExternalLinkComponent href={rollup.website} className="break-all">{rollup.website}</ExternalLinkComponent>}
                />
                <FieldRow 
                  label="Scan" 
                  value={<ExternalLinkComponent href={rollup.scan} className="break-all">{rollup.scan}</ExternalLinkComponent>}
                />
              </InfoGrid>
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
    <div className="space-y-4">
      <DetailHeader variant="error">Search Error</DetailHeader>
      <div className="text-sm text-red-500">
        {(result.data as any)?.error}
      </div>
    </div>
  )
}