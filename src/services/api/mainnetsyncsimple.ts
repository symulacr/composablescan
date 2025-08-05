


interface BlockData {
  height: number
  timestamp: number
  transactions: number
  hash?: string
}

interface NetworkData {
  latestBlock: number
  recentBlocks: BlockData[]
  lastUpdated: number
  isConnected: boolean
  avgBlockTime: number
}


const mainnetState: NetworkData = {
  latestBlock: 0,
  recentBlocks: [],
  lastUpdated: 0,
  isConnected: false,
  avgBlockTime: 0
}


let subscribers: ((state: NetworkData) => void)[] = []

export function subscribeToMainnetSync(callback: (state: NetworkData) => void): () => void {
  subscribers.push(callback)
  

  callback(mainnetState)
  

  return () => {
    subscribers = subscribers.filter(sub => sub !== callback)
  }
}

export function getMainnetState(): NetworkData {
  return { ...mainnetState }
}


function notifySubscribers() {
  subscribers.forEach(callback => {
    try {
      callback({ ...mainnetState })
    } catch (error) {

    }
  })
}


async function updateMainnetData() {
  try {

    

    const { discoverLatestBlock, getRecentBlocks } = await import('./blockdiscovery')
    
    const latestBlock = await discoverLatestBlock()
    const recentBlocks = await getRecentBlocks(13)
    

    let avgBlockTime = 0
    if (recentBlocks.length >= 5) {
      const sortedBlocks = recentBlocks
        .map(block => ({
          height: (block as any).height,
          timestamp: (block as any).timestamp,
          transactions: (block as any).num_transactions || 0,
          hash: (block as any).hash
        }))
        .sort((a, b) => b.height - a.height)
      
      const blockTimes: number[] = []
      for (let i = 0; i < sortedBlocks.length - 1; i++) {
        const currentTime = sortedBlocks[i].timestamp
        const previousTime = sortedBlocks[i + 1].timestamp
        if (currentTime > previousTime) {
          const timeDiff = currentTime - previousTime
          if (timeDiff > 0 && timeDiff < 300) {
            blockTimes.push(timeDiff)
          }
        }
      }
      
      if (blockTimes.length > 0) {
        avgBlockTime = Math.round(blockTimes.reduce((sum, time) => sum + time, 0) / blockTimes.length)
      }
      

      mainnetState.latestBlock = latestBlock
      mainnetState.recentBlocks = sortedBlocks
      mainnetState.avgBlockTime = avgBlockTime
      mainnetState.lastUpdated = Date.now()
      mainnetState.isConnected = true
      

    }
    
  } catch (error) {

    mainnetState.isConnected = false
  }
  

  notifySubscribers()
}


let syncInterval: NodeJS.Timeout | null = null

export function startMainnetSync() {
  if (syncInterval) {

    return
  }
  

  

  updateMainnetData()
  

  syncInterval = setInterval(updateMainnetData, 10000)
  

}

export function stopMainnetSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null

  }
}


if (typeof window !== 'undefined') {
  startMainnetSync()
}