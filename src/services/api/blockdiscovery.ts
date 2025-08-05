


interface BlockRange {
  latest: number;
  earliest: number;
  count: number;
}



let blockRangeCache: { [network: string]: { data: BlockRange; timestamp: number } } = {}
const CACHE_DURATION = 5000

async function makeApiCall(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return response.json()
}

export async function discoverLatestBlock(): Promise<number> {

  const cacheKey = 'mainnet'
  const cached = blockRangeCache[cacheKey]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data.latest
  }
  
  try {

    
    const response = await fetch('/api/block-discovery/mainnet', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!response.ok) {
      throw new Error(`Block discovery failed: ${response.status}`)
    }
    
    const result = await response.json()
    const latestFound = result.latest
    
    if (!latestFound || latestFound === 0) {
      throw new Error('No blocks found on mainnet')
    }
    

    blockRangeCache[cacheKey] = {
      data: { latest: latestFound, earliest: 1, count: latestFound },
      timestamp: Date.now()
    }
    

    return latestFound
    
  } catch (error) {

    throw new Error(`Unable to discover latest mainnet block: ${error}`)
  }
}

export async function getRecentBlocks(count: number = 5): Promise<unknown[]> {
  const latest = await discoverLatestBlock()
  const blocks = []
  
  for (let i = 0; i < count; i++) {
    const blockHeight = latest - i
    if (blockHeight < 1) break
    
    try {
      const response = await fetch(`/api/block/${blockHeight}?network=mainnet`)
      
      if (!response.ok) {

        continue
      }
      
      const blockResponse = await response.json()
      

      if (blockResponse && blockResponse.header) {
        const processedBlock = {
          height: blockResponse.header.fields.height,
          timestamp: blockResponse.header.fields.timestamp,
          num_transactions: blockResponse.num_transactions || 0,
          hash: blockResponse.hash,
          size: blockResponse.size || 0
        }
        blocks.push(processedBlock)
      }
    } catch (error) {

      continue
    }
  }
  
  return blocks
}

export function clearBlockCache() {
  blockRangeCache = {}
}