import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ namespace: string }> }
) {
  try {
    const { namespace } = await params
    const targetNamespace = parseInt(namespace)
    
    if (isNaN(targetNamespace)) {
      return NextResponse.json(
        { error: 'Invalid namespace ID' },
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
      

      if (namespace === targetNamespace) {

        
        const rollupInfo = {
          namespace: namespace,
          name: name,
          website: website,
          scan: scan
        }
        
        return NextResponse.json(rollupInfo, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        })
      }
    }
    

    return NextResponse.json(
      { error: `No rollup found for namespace ${targetNamespace}` },
      { status: 404 }
    )
    
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to search rollup data' },
      { status: 500 }
    )
  }
}