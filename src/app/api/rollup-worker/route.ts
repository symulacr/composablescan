import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { getWebWorkerUrl } = await import('@/lib/config')
    const webWorkerUrl = getWebWorkerUrl()
    

    
    const response = await fetch(webWorkerUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; composable-scan)',
        'Accept': 'application/javascript, text/javascript, */*',
        'Cache-Control': 'no-cache',
      }
    })
    
    if (!response.ok) {

      return NextResponse.json(
        { error: 'Failed to fetch rollup worker data' },
        { status: response.status }
      )
    }
    
    const content = await response.text()
    

    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch rollup worker data' },
      { status: 500 }
    )
  }
}