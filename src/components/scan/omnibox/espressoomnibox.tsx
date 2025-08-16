"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Send, Hash, Layers, Server } from "lucide-react"
import useDebounce from "@/hooks/usedebounce"
import { search as apiSearch, formatBlockTime, formatTransactionHash, getBlock, getBlockByHash } from "@/services/api/espressoapi"
import { resolveRollupName, isRollupResolverReady, initializeRollupResolver, universalRollupSearch } from "@/services/api/rollupresolver"
import { useNetwork } from "@/contexts/networkcontext"
import BlockModal from "@/components/scan/details/blockmodal"
import TransactionModal from "@/components/scan/details/transactionmodal"
import NamespaceModal from "@/components/scan/details/namespacemodal"
import type { EspressoTransaction } from "@/types/espresso"

interface EspressoResult {
  id: string
  type: 'block' | 'transaction' | 'rollup' | 'namespace'
  label: string
  icon: React.ReactNode
  description?: string
  time?: string
}

interface SearchResults {
  results: EspressoResult[]
}

function EspressoOmnibox() {
  const { currentNetwork, networkInfo } = useNetwork()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<EspressoResult | null>(null)
  const [blockModalHeight, setBlockModalHeight] = useState<number | null>(null)
  const [transactionModalHash, setTransactionModalHash] = useState<string | null>(null)
  const [namespaceModalId, setNamespaceModalId] = useState<number | null>(null)
  const debouncedQuery = useDebounce(query, 300)


  useEffect(() => {
    if (!isRollupResolverReady()) {
      initializeRollupResolver()
    }
  }, [])


  useEffect(() => {
    setResults(null)
    setQuery("")
    setSelectedResult(null)
  }, [currentNetwork])


  const detectSearchType = (input: string) => {
    if (input.startsWith('TX~')) return 'transaction'
    if (input.startsWith('BLOCK~')) return 'block_hash'

    if (/^\d{1,12}$/.test(input)) return 'block_or_namespace'
    if (/^[a-zA-Z]+$/.test(input)) return 'rollup_name'
    return 'invalid'
  }

  useEffect(() => {
    if (!isFocused) {
      setResults(null)
      return
    }

    if (!debouncedQuery) {

      setResults({ results: [] })
      return
    }

    const searchType = detectSearchType(debouncedQuery)
    
    if (searchType === 'invalid') {
      setResults({ results: [] })
      return
    }

    setIsLoading(true)
    

    const performSearch = async () => {
      try {
        const searchResults: EspressoResult[] = []
        
        if (searchType === 'transaction') {
          const result = await apiSearch(debouncedQuery, 'transaction')
          const txData = result.data as EspressoTransaction
          
          searchResults.push({
            id: txData.hash,
            type: 'transaction',
            label: `TX ${formatTransactionHash(txData.hash)}`,
            icon: <Hash className="h-4 w-4 text-blue-500" />,
            description: `Block #${txData.block_height} • NS ${txData.namespace}`,
            time: txData.timestamp ? formatBlockTime(txData.timestamp) : 'Unknown'
          })
        } else if (searchType === 'block_hash') {
          try {
            const blockData = await getBlockByHash(debouncedQuery)
            
            searchResults.push({
              id: `block-hash-${blockData.height}`,
              type: 'block',
              label: `Block #${blockData.height}`,
              icon: <Layers className="h-4 w-4 text-green-500" />,
              description: `${blockData.transactions || 0} transactions • Hash: ${debouncedQuery.substring(0, 20)}...`,
              time: formatBlockTime(blockData.timestamp)
            })
          } catch (error) {

          }
        } else if (searchType === 'block_or_namespace') {
          let blockFound = false
          let namespaceFound = false
          

          try {
            const blockHeight = parseInt(debouncedQuery)
            const blockData = await getBlock(blockHeight)
            blockFound = true
            
            searchResults.push({
              id: `block-${blockData.height}`,
              type: 'block',
              label: `Block #${blockData.height}`,
              icon: <Layers className="h-4 w-4 text-green-500" />,
              description: `${blockData.transactions || 0} transactions • ${Math.round((blockData.size || 0) / 1024)}KB`,
              time: formatBlockTime(blockData.timestamp)
            })
          } catch (error) {

            if (parseInt(debouncedQuery) > 0) {
              searchResults.push({
                id: `block-error-${debouncedQuery}`,
                type: 'block',
                label: `Block #${debouncedQuery} not found`,
                icon: <Layers className="h-4 w-4 text-red-500" />,
                description: `This block height doesn't exist yet on ${currentNetwork}`,
                time: 'N/A'
              })
            }

          }
          


          const namespaceId = parseInt(debouncedQuery)
          if (namespaceId >= 0 && namespaceId <= 99999999999) {
            try {

              const rollupResults = await universalRollupSearch(debouncedQuery)
              
              if (rollupResults.length > 0) {
                rollupResults.forEach((rollup, index) => {
                  namespaceFound = true
                  
                  searchResults.push({
                    id: `namespace-universal-${rollup.namespace}-${index}`,
                    type: 'namespace',
                    label: `Namespace ${rollup.namespace} (${rollup.name})`,
                    icon: <Server className="h-4 w-4 text-purple-500" />,
                    description: `${rollup.name} rollup • View transactions • ${rollup.website}`,
                    time: 'Active'
                  })
                })
              }

            } catch (error) {

            }
          }
          

          if (blockFound && namespaceFound && searchResults.length > 1) {

            searchResults.forEach(result => {
              if (result.type === 'block') {
                result.description = `Block data • ${result.description}`
              } else if (result.type === 'namespace') {
                result.description = `Rollup data • ${result.description}`
              }
            })
          }
        } else if (searchType === 'rollup_name') {

          try {
            const rollupResults = await universalRollupSearch(debouncedQuery)
            
            if (rollupResults.length > 0) {
              rollupResults.forEach((rollup, index) => {
                searchResults.push({
                  id: `rollup-${rollup.name}-${rollup.namespace}-${index}`,
                  type: 'namespace',
                  label: `${rollup.name} (Namespace ${rollup.namespace})`,
                  icon: <Server className="h-4 w-4 text-orange-500" />,
                  description: `${rollup.name} rollup • View transactions • ${rollup.website}`,
                  time: 'Active'
                })
              })
              

            }

          } catch (error) {

          }
        }
        
        setResults({ results: searchResults })
      } catch (error) {

        setResults({ 
          results: [{
            id: 'error',
            type: 'block',
            label: 'Search failed',
            icon: <Search className="h-4 w-4 text-red-500" />,
            description: 'Please try again',
            time: ''
          }]
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    performSearch()
  }, [debouncedQuery, isFocused])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleFocus = () => {
    setSelectedResult(null)
    setIsFocused(true)
  }

  const handleResultClick = (result: EspressoResult) => {
    setSelectedResult(result)
    setIsFocused(false)
    

    if (result.type === 'block') {
      const height = parseInt(result.id.replace('block-', ''))
      setBlockModalHeight(height)
    } else if (result.type === 'transaction') {
      setTransactionModalHash(result.id)
    } else if (result.type === 'namespace') {
      const namespaceId = parseInt(result.id.replace('namespace-', ''))
      setNamespaceModalId(namespaceId)
    } else if (result.type === 'rollup') {

      const rollupMatch = result.id.match(/rollup-(.+)/)
      if (rollupMatch) {
        const rollupName = rollupMatch[1]
        const namespace = resolveRollupName(rollupName)
        if (namespace !== null) {
          setNamespaceModalId(namespace)
        }
      }
    }
  }

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: 0.4 },
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 },
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 },
    },
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="relative flex flex-col justify-start items-center min-h-[200px]">
        <div className="w-full sticky top-0 bg-background z-10 pt-4 pb-1">
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block" htmlFor="search">
            Search
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Block, transaction, rollup..."
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="pl-16 pr-6 py-8 h-32 text-2xl font-medium focus-visible:ring-offset-0 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-lg border-2"
              style={{ backgroundColor: '#E0E0E0', color: '#000000', borderColor: '#000000' }}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2">
              <Search className="h-8 w-8" style={{ color: '#000000' }} />
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="animate-spin"
                  >
                    <Search className="w-6 h-6 text-gray-400" />
                  </motion.div>
                ) : query.length > 0 ? (
                  <motion.div
                    key="send"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Send className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full">
          <AnimatePresence>
            {isFocused && results && results.results && results.results.length > 0 && !selectedResult && (
              <motion.div
                className="w-full border-2 shadow-xl overflow-hidden mt-3"
                style={{ borderColor: '#000000', backgroundColor: '#FFFFFF' }}
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                {results.results.length > 0 ? (
                  <motion.ul>
                    {results.results.map((result) => (
                      <motion.li
                        key={result.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all duration-200 group border-b last:border-b-0 border-gray-100 dark:border-gray-600"
                        variants={item}
                        layout
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <span className="text-primary group-hover:scale-110 transition-transform">{result.icon}</span>
                          <div className="flex flex-col flex-1">
                            <span className="text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                              {result.label}
                            </span>
                            {result.description && (
                              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {result.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 font-medium">{result.time}</span>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                ) : query && !isLoading ? (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    {detectSearchType(query) === 'invalid' 
                      ? "Please enter a block height, TX~ hash, or rollup name"
                      : "Searching..."}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    Enter a search term to explore the Espresso Network
                  </div>
                )}
                
                <div className="mt-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{networkInfo.name} • Real-time data</span>
                    <span>ESC to cancel</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

    <BlockModal
      blockHeight={blockModalHeight}
      isOpen={blockModalHeight !== null}
      onClose={() => setBlockModalHeight(null)}
    />
    
    <TransactionModal
      transactionHash={transactionModalHash}
      isOpen={transactionModalHash !== null}
      onClose={() => setTransactionModalHash(null)}
    />
    
    <NamespaceModal
      namespace={namespaceModalId}
      isOpen={namespaceModalId !== null}
      onClose={() => setNamespaceModalId(null)}
    />
  </>
  )
}

export default EspressoOmnibox