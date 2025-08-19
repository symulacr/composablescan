

export async function makeApiCall(url: string): Promise<Response> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response
}

import { getApiUrl } from '../../lib/config'

export async function getLatestBlockHeight(): Promise<number> {
  const blockStateUrl = getApiUrl('/block-state/block-height')
  const response = await makeApiCall(blockStateUrl)
  const latestHeight = await response.json()
  
  if (typeof latestHeight === 'number' && latestHeight > 0) {
    return latestHeight
  }
  
  throw new Error(`Invalid block height received: ${latestHeight}`)
}

export async function getTotalTransactions(): Promise<number> {
  const url = getApiUrl('/node/transactions/count')
  const response = await makeApiCall(url)
  const total = await response.json()
  
  if (typeof total === 'number' && total >= 0) {
    return total
  }
  
  throw new Error(`Invalid transaction count received: ${total}`)
}

export async function getTotalPayloadSize(): Promise<number> {
  const url = getApiUrl('/node/payloads/total-size')
  const response = await makeApiCall(url)
  const size = await response.json()
  
  if (typeof size === 'number' && size >= 0) {
    return size
  }
  
  throw new Error(`Invalid payload size received: ${size}`)
}

export async function getSuccessRate(): Promise<number> {
  const url = getApiUrl('/status/success-rate')
  const response = await makeApiCall(url)
  const rate = await response.json()
  
  if (typeof rate === 'number' && rate >= 0 && rate <= 1) {
    return rate
  }
  
  throw new Error(`Invalid success rate received: ${rate}`)
}



