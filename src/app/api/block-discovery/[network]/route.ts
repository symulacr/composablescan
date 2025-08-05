import { NextRequest, NextResponse } from 'next/server'


async function getMainnetLatestBlock(): Promise<number> {
  const { getApiUrl } = await import('@/lib/config')
  const response = await fetch(getApiUrl('/status/block-height'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const blockHeight = await response.json()
  return typeof blockHeight === 'number' ? blockHeight : parseInt(blockHeight)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ network: string }> }
) {
  try {
    const { network } = await params
    

    if (network !== 'mainnet') {
      return NextResponse.json(
        { error: 'Only mainnet is supported' },
        { status: 400 }
      )
    }
    
    const latestBlock = await getMainnetLatestBlock()
    
    return NextResponse.json(
      { latest: latestBlock, network: 'mainnet' },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
    
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to estimate latest block' },
      { status: 500 }
    )
  }
}