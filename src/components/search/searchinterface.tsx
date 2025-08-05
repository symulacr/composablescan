"use client"

import { useState, useEffect, useCallback } from "react"
import { useNetwork } from '@/contexts/networkcontext'
import { useDualNetworkData } from '@/hooks/usedualnetwork'
import { getBlock, getTransactionByHash, getBlockByHash } from '@/services/api/espressoapi'
import { universalRollupSearch, initializeRollupResolver, getRollupName } from '@/services/api/rollupresolver'
import { getBlockStream, StreamingBlock, StreamingStats } from '@/services/websocket/espressostream'
import SearchInput from './searchinput'
import SearchResults from './searchresults'
import SearchDetails from './searchdetails'
import LiveStats from './livestats'

interface NetworkData {
  latestBlock: number
  totalTransactions: number
  avgBlockTime: number
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
  const dualData = useDualNetworkData()
  const currentData = dualData[currentNetwork]
  
  const [query, setQuery] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [liveResults, setLiveResults] = useState<SearchResult[]>([])
  const [selectedResults, setSelectedResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [liveStreaming, setLiveStreaming] = useState(false)
  const [streamingBlocks, setStreamingBlocks] = useState<StreamingBlock[]>([])
  const [streamingStats, setStreamingStats] = useState<StreamingStats | null>(null)



  const networkData: NetworkData = streamingStats && streamingStats.isConnected ? {
    latestBlock: streamingStats.latestBlock,
    totalTransactions: streamingStats.totalTransactions,
    avgBlockTime: streamingStats.avgBlockTime > 0 ? streamingStats.avgBlockTime : (currentData.avgBlockTime || 12),
    isConnected: streamingStats.isConnected
  } : {
    latestBlock: currentData.latestBlock,
    totalTransactions: Math.floor(currentData.recentBlocks.reduce((sum, block) => sum + (block.transactions || 0), 0) / Math.max(currentData.recentBlocks.length, 1)),
    avgBlockTime: currentData.avgBlockTime > 0 ? currentData.avgBlockTime : 12,
    isConnected: liveStreaming ? false : currentData.isConnected
  }


  const detectSearchType = useCallback((input: string) => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return 'invalid'
    

    if (trimmedInput.startsWith('TX~')) return 'transaction'
    

    if (trimmedInput.startsWith('BLOCK~')) return 'block_hash'
    

    if (/^[A-Za-z0-9+/=_-]{44}$/.test(trimmedInput)) {

      return 'transaction'
    }
    

    if (/^0x[a-fA-F0-9]{64}$/.test(trimmedInput)) return 'block_hash'
    if (/^[a-fA-F0-9]{64}$/.test(trimmedInput)) return 'transaction'
    

    if (/^\d{1,12}$/.test(trimmedInput)) return 'block_or_namespace'
    

    if (/^\d{13,15}$/.test(trimmedInput)) return 'namespace'
    

    if (/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(trimmedInput)) return 'rollup_name'
    
    return 'invalid'
  }, [])


  const performLiveSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 1) {
      setLiveResults([])
      return
    }

    const searchType = detectSearchType(searchQuery)
    if (searchType === 'invalid') {
      setLiveResults([])
      return
    }


    if (searchQuery.trim().length < 2 && !/^\d+$/.test(searchQuery.trim())) {
      setLiveResults([])
      return
    }

    setIsSearching(true)

    try {
      const results: SearchResult[] = []


      results.push({
        type: 'loading',
        data: null,
        query: searchQuery,
        displayText: 'Searching...'
      })
      setLiveResults(results)


      if (searchType === 'transaction') {
        try {

          const cleanQuery = searchQuery.startsWith('TX~') ? searchQuery : `TX~${searchQuery}`
          const txData = await getTransactionByHash(cleanQuery)
          results.splice(-1, 1)
          results.push({
            type: 'transaction',
            data: txData,
            query: searchQuery,
            displayText: `Transaction ${searchQuery.substring(0, 20)}${searchQuery.length > 20 ? '...' : ''}`
          })
        } catch {
          results.splice(-1, 1)
          results.push({
            type: 'error',
            data: { error: `Transaction not found: ${searchQuery}` },
            query: searchQuery
          })
        }
      } 
      else if (searchType === 'block_hash') {
        try {

          const blockHashQuery = searchQuery.startsWith('BLOCK~') ? searchQuery : `BLOCK~${searchQuery}`
          const blockData = await getBlockByHash(blockHashQuery)
          results.splice(-1, 1)
          results.push({
            type: 'block_hash',
            data: blockData,
            query: searchQuery,
            displayText: `Block Hash ${searchQuery.substring(0, 20)}${searchQuery.length > 20 ? '...' : ''}`
          })
        } catch {
          results.splice(-1, 1)
          results.push({
            type: 'error',
            data: { error: `Block hash not found: ${searchQuery}` },
            query: searchQuery
          })
        }
      }
      else if (searchType === 'block_or_namespace') {
        const blockHeight = parseInt(searchQuery)
        

        try {
          const blockData = await getBlock(blockHeight)
          results.splice(-1, 1)
          results.push({
            type: 'block',
            data: blockData,
            query: searchQuery,
            displayText: `Block #${blockHeight}`
          })
        } catch {

        }


        const rollupName = getRollupName(blockHeight)
        if (rollupName) {

          try {

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
            
          } catch {

            if (!results.find(r => r.type === 'block')) {
              results.splice(-1, 1)
            }
            
            results.push({
              type: 'namespace',
              data: { namespace: blockHeight },
              query: searchQuery,
              displayText: `Namespace #${blockHeight} (${rollupName})`
            })
          }
        }

      }
      else if (searchType === 'namespace') {

        const namespaceId = parseInt(searchQuery)
        const rollupName = getRollupName(namespaceId)
        
        if (rollupName) {

          try {

            const namespaceData = { namespace: namespaceId }
            
            results.splice(-1, 1)
            
            results.push({
              type: 'namespace',
              data: namespaceData,
              query: searchQuery,
              displayText: `Namespace #${namespaceId} (${rollupName})`
            })
            
          } catch {
            results.splice(-1, 1)

            results.push({
              type: 'namespace',
              data: { namespace: namespaceId },
              query: searchQuery,
              displayText: `Namespace #${namespaceId} (${rollupName})`
            })
          }
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
        try {
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
        } catch {
          results.splice(-1, 1)
          results.push({
            type: 'error',
            data: { error: `Rollup search failed: ${searchQuery}` },
            query: searchQuery
          })
        }
      }

      setLiveResults(results.filter(r => r.type !== 'loading'))
    } catch {

      setLiveResults([{
        type: 'error',
        data: { error: error instanceof Error ? error.message : 'Search failed' },
        query: searchQuery
      }])
    } finally {
      setIsSearching(false)
    }
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
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [query, performLiveSearch, selectedResults])


  useEffect(() => {
    initializeRollupResolver().catch(() => {})
  }, [currentNetwork])


  useEffect(() => {
    const startStreaming = async () => {
      try {
        const stream = getBlockStream()


        stream.onBlock((block: StreamingBlock) => {

          setStreamingBlocks(prev => {
            const updated = [block, ...prev].slice(0, 10)
            return updated
          })
        })


        stream.onStats((stats: StreamingStats) => {
          setStreamingStats(stats)
        })

        stream.onError((error: Error) => {

          setLiveStreaming(false)
        })


        await stream.connect()
        setLiveStreaming(true)
        


      } catch {

        setLiveStreaming(false)
      }
    }


    startStreaming()


    return () => {

      setLiveStreaming(false)
      setStreamingBlocks([])
      setStreamingStats(null)
    }
  }, [currentNetwork])


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


  const handleStreamingBlockSelect = useCallback((height: number) => {
    setQuery(height.toString())
    setIsActive(false)
  }, [])

  return (
    <div className="space-y-8">
      {/* Header with Real-time Insights */}
      <LiveStats liveStreaming={liveStreaming} networkData={networkData} />

      {/* Real-time Search Input */}
      <div className="relative">
        <SearchInput
          query={query}
          setQuery={setQuery}
          isActive={isActive}
          setIsActive={setIsActive}
          isSearching={isSearching}
          onSearch={handleSearch}
        />

        {/* Live Search Results Dropdown */}
        <SearchResults
          isActive={isActive}
          liveResults={liveResults}
          isSearching={isSearching}
          liveStreaming={liveStreaming}
          query={query}
          streamingBlocks={streamingBlocks}
          onResultSelect={handleResultSelect}
          onStreamingBlockSelect={handleStreamingBlockSelect}
        />
      </div>

      {/* Selected Search Results */}
      <SearchDetails selectedResults={selectedResults} />

      {/* Quick Actions */}
    </div>
  )
}