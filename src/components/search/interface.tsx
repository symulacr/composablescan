"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useNetwork } from '@/contexts/networkcontext'
import { useDualNetworkData } from '@/hooks/useNet'
import { getBlock, getTransactionByHash, getBlockByHash } from '@/services/api/main'
import { universalRollupSearch, initializeRollupResolver, getRollupName } from '@/services/api/resolver'
import { 
  SEARCH_DEBOUNCE_MS, 
  BASE64_HASH_LENGTH, 
  HEX_HASH_LENGTH, 
  MAX_BLOCK_HEIGHT_DIGITS,
  MIN_NAMESPACE_DIGITS,
  MAX_NAMESPACE_DIGITS,
  MIN_SEARCH_LENGTH,
  MIN_SEARCH_LENGTH_NON_NUMERIC
} from '@/types/espresso'
import SearchInput from './input'
import SearchResults from './results'
import SearchDetails from './details'
import LiveStats from './stats'
interface NetworkData {
  latestBlock: number
  totalTransactions: number
  totalPayloadSize: number
  successRate: number
  isConnected: boolean
}

interface SearchResult {
  type: 'block' | 'transaction' | 'rollup' | 'namespace' | 'block_hash' | 'error' | 'loading'
  data: unknown
  query: string
  displayText?: string
}

export default function SearchInterface() {
  const { currentNetwork } = useNetwork()
  const netData = useDualNetworkData()
  const currentData = netData[currentNetwork]
  
  const [query, setQuery] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [liveResults, setLiveResults] = useState<SearchResult[]>([])
  const [selectedResults, setSelectedResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef('')

  const networkData: NetworkData = {
    latestBlock: currentData.latestBlock,
    totalTransactions: currentData.totalTransactions || 0,
    totalPayloadSize: currentData.totalPayloadSize || 0,
    successRate: currentData.successRate || 0,
    isConnected: currentData.isConnected
  }


  const detectSearchType = useCallback((input: string) => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return 'invalid'
    
    if (trimmedInput.startsWith('TX~')) return 'transaction'
    if (trimmedInput.startsWith('BLOCK~')) return 'block_hash'
    
    const base64Pattern = new RegExp(`^[A-Za-z0-9+/=_-]{${BASE64_HASH_LENGTH}}$`)
    const hexWithPrefixPattern = new RegExp(`^0x[a-fA-F0-9]{${HEX_HASH_LENGTH}}$`)
    const hexPattern = new RegExp(`^[a-fA-F0-9]{${HEX_HASH_LENGTH}}$`)
    
    if (base64Pattern.test(trimmedInput)) return 'transaction'
    if (hexWithPrefixPattern.test(trimmedInput)) return 'block_hash'  
    if (hexPattern.test(trimmedInput)) return 'transaction'
    
    const blockHeightPattern = new RegExp(`^\\d{1,${MAX_BLOCK_HEIGHT_DIGITS}}$`)
    const namespacePattern = new RegExp(`^\\d{${MIN_NAMESPACE_DIGITS},${MAX_NAMESPACE_DIGITS}}$`)
    
    if (namespacePattern.test(trimmedInput)) return 'namespace'
    if (blockHeightPattern.test(trimmedInput)) return 'block_or_namespace'
    
    if (/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(trimmedInput)) return 'rollup_name'
    
    return 'invalid'
  }, [])


  const performLiveSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < MIN_SEARCH_LENGTH) {
      setLiveResults([])
      return
    }

    if (searchRef.current === searchQuery.trim()) return
    searchRef.current = searchQuery.trim()

    const searchType = detectSearchType(searchQuery)
    if (searchType === 'invalid') {
      setLiveResults([])
      return
    }

    if (searchQuery.trim().length < MIN_SEARCH_LENGTH_NON_NUMERIC && !/^\d+$/.test(searchQuery.trim())) {
      setLiveResults([])
      return
    }

    setIsSearching(true)

    const results: SearchResult[] = []


      results.push({
        type: 'loading',
        data: null,
        query: searchQuery,
        displayText: 'Searching...'
      })
      setLiveResults(results)


      if (searchType === 'transaction') {
        const cleanQuery = searchQuery.startsWith('TX~') ? searchQuery : `TX~${searchQuery}`
        const txData = await getTransactionByHash(cleanQuery)
        results.splice(-1, 1)
        results.push({
          type: 'transaction',
          data: txData,
          query: searchQuery,
          displayText: `Transaction ${searchQuery.substring(0, 20)}${searchQuery.length > 20 ? '...' : ''}`
        })
      } 
      else if (searchType === 'block_hash') {
        const blockHashQuery = searchQuery.startsWith('BLOCK~') ? searchQuery : `BLOCK~${searchQuery}`
        const blockData = await getBlockByHash(blockHashQuery)
        results.splice(-1, 1)
        results.push({
          type: 'block_hash',
          data: blockData,
          query: searchQuery,
          displayText: `Block Hash ${searchQuery.substring(0, 20)}${searchQuery.length > 20 ? '...' : ''}`
        })
      }
      else if (searchType === 'block_or_namespace') {
        const blockHeight = parseInt(searchQuery)
        

        const blockData = await getBlock(blockHeight)
        results.splice(-1, 1)
        results.push({
          type: 'block',
          data: blockData,
          query: searchQuery,
          displayText: `Block #${blockHeight}`
        })


        const rollupName = getRollupName(blockHeight)
        if (rollupName) {

          const namespaceData = { namespace: blockHeight }
          
          if (!results.find(r => r.type === 'block')) {
            results.splice(-1, 1)
          }
          
          results.push({
            type: 'namespace',
            data: namespaceData,
            query: searchQuery,
            displayText: `Namespace #${blockHeight} (${rollupName})`
          })
        }

      }
      else if (searchType === 'namespace') {

        const namespaceId = parseInt(searchQuery)
        const rollupName = getRollupName(namespaceId)
        
        if (rollupName) {

          const namespaceData = { namespace: namespaceId }
          
          results.splice(-1, 1)
          
          results.push({
            type: 'namespace',
            data: namespaceData,
            query: searchQuery,
            displayText: `Namespace #${namespaceId} (${rollupName})`
          })
        } else {

          results.splice(-1, 1)
          results.push({
            type: 'error',
            data: { error: `Namespace #${searchQuery} is not a registered rollup` },
            query: searchQuery
          })
        }
      }
      else if (searchType === 'rollup_name') {
        const rollupData = await universalRollupSearch(searchQuery)
        results.splice(-1, 1)
        if (rollupData && rollupData.length > 0) {
          results.push({
            type: 'rollup',
            data: rollupData,
            query: searchQuery,
            displayText: `Rollup "${searchQuery}"`
          })
        } else {
          results.push({
            type: 'error',
            data: { error: `No rollup found: ${searchQuery}` },
            query: searchQuery
          })
        }
      }

      setLiveResults(results.filter(r => r.type !== 'loading'))
      setIsSearching(false)
  }, [currentNetwork, currentData.latestBlock, detectSearchType])


  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim()) {
        performLiveSearch(query)

        if (selectedResults.length > 0 && selectedResults[0].query !== query.trim()) {
          setSelectedResults([])
        }
      } else {
        setLiveResults([])
        setSelectedResults([])
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(handler)
    }
  }, [query, performLiveSearch, selectedResults])




  useEffect(() => {
    initializeRollupResolver();
  }, []);



  const handleResultSelect = useCallback((result: SearchResult) => {

    setIsActive(false)
    setLiveResults([])
    

    setSelectedResults([result])
    

    setQuery(result.query)
  }, [])


  const handleSearch = useCallback((searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (finalQuery.trim()) {

      const validResult = liveResults.find(r => r.type !== 'error' && r.type !== 'loading')
      if (validResult) {
        setSelectedResults([validResult])
      } else {

        performLiveSearch(finalQuery)
      }
      setIsActive(false)
    }
  }, [query, liveResults, performLiveSearch])



  return (
    <div className="space-y-8">
      <LiveStats liveStreaming={false} networkData={networkData} />

      <div className="relative">
        <SearchInput
          query={query}
          setQuery={setQuery}
          isActive={isActive}
          setIsActive={setIsActive}
          isSearching={isSearching}
          onSearch={handleSearch}
        />

        <SearchResults
          isActive={isActive}
          liveResults={liveResults}
          isSearching={isSearching}
          liveStreaming={false}
          query={query}
          streamingBlocks={[]}
          onResultSelect={handleResultSelect}
          onStreamingBlockSelect={() => {}}
        />
      </div>

      <SearchDetails selectedResults={selectedResults} />

    </div>
  )
}