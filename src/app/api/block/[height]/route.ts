import { NextRequest, NextResponse } from 'next/server'


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ height: string }> }
) {
  try {
    const { height } = await params
    

    const { getApiUrl } = await import('@/lib/config')
    const apiUrl = getApiUrl('/availability/block/' + height)
    

    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {

      return NextResponse.json(
        { error: `Block ${height} not found` },
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
      { error: 'Failed to fetch block data' },
      { status: 500 }
    )
  }
}