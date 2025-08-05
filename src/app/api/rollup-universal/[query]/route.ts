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
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params
    const searchTerm = decodeURIComponent(query).trim()
    
    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      )
    }
    
    const { getWebWorkerUrl } = await import('@/lib/config')
    const webWorkerUrl = getWebWorkerUrl()
    

    
    const response = await fetch(webWorkerUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; composable-scan)',
      },
    })
    
    if (!response.ok) {

      return NextResponse.json(
        { error: 'Failed to fetch rollup worker data' },
        { status: response.status }
      )
    }
    
    let content = await response.text()
    

    content = content.replace(/Hl=1397311310,qr=new k\(Hl/g, 'qr=new k(1397311310')
    

    const regex = /new k\(([^,]+),"([^"]+)",new URL\("([^"]+)"\),new URL\("([^"]+)"\)\)/g
    let match
    const results = []
    

    const isNumericSearch = /^\d+$/.test(searchTerm)
    const targetId = isNumericSearch ? parseInt(searchTerm) : null
    const targetName = isNumericSearch ? null : searchTerm.toLowerCase()
    

    
    while ((match = regex.exec(content)) !== null) {
      const [, namespaceStr, name, website, scan] = match
      

      let namespace: number
      if (namespaceStr === '1397311310') {
        namespace = 1397311310
      } else if (/^\d+$/.test(namespaceStr)) {
        namespace = parseInt(namespaceStr)
      } else {

        continue
      }
      

      const matchesId = isNumericSearch && namespace === targetId
      const matchesName = !isNumericSearch && name.toLowerCase() === targetName
      
      if (matchesId || matchesName) {
        const rollupInfo = {
          namespace: namespace,
          name: name,
          website: website,
          scan: scan
        }
        
        results.push(rollupInfo)
      }
    }
    
    if (results.length === 0) {

      return NextResponse.json(
        { error: `No rollup found for "${searchTerm}"` },
        { status: 404 }
      )
    }
    

    const responseData = results.length === 1 ? results[0] : results
    
    return NextResponse.json(responseData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to search rollup data' },
      { status: 500 }
    )
  }
}