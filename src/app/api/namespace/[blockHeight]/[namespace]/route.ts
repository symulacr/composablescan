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
  { params }: { params: Promise<{ blockHeight: string; namespace: string }> }
) {
  try {
    const { blockHeight, namespace } = await params
    

    const { getApiUrl } = await import('@/lib/config')
    const apiUrl = getApiUrl(`/availability/block/${blockHeight}/namespace/${namespace}`)
    

    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {

      return NextResponse.json(
        { error: `Namespace ${namespace} not found in block ${blockHeight}` },
        { status: response.status }
      )
    }
    
    const namespaceData = await response.json()
    

    
    return NextResponse.json(namespaceData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch namespace data' },
      { status: 500 }
    )
  }
}