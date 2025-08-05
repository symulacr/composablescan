import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params
    

    const decodedHash = decodeURIComponent(hash)
    

    const { getApiUrl } = await import('@/lib/config')
    const apiUrl = getApiUrl('/availability/block/hash/' + decodedHash)
    

    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {

      return NextResponse.json(
        { error: `Block with hash ${hash} not found` },
        { status: response.status }
      )
    }
    
    const blockData = await response.json()
    

    if (blockData.payload) {
      delete blockData.payload
    }
    

    
    return NextResponse.json(blockData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch block data by hash' },
      { status: 500 }
    )
  }
}