import { NextRequest, NextResponse } from 'next/server'
import { getWebWorkerUrl } from '@/lib/config'
import { parseRollupData } from '@/lib/rollup-parser'

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const namespace = searchParams.get('namespace')
  const raw = searchParams.get('raw')

  if (raw === 'true') {
    const response = await fetch(getWebWorkerUrl())
    if (!response.ok) {
      return new Response('Rollup service unavailable', { status: 503 })
    }
    return new Response(await response.text())
  }

  const response = await fetch(getWebWorkerUrl(), {
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

  if (namespace) {
    const targetNamespace = parseInt(namespace)
    if (isNaN(targetNamespace)) {
      return NextResponse.json(
        { error: 'Invalid namespace ID' },
        { status: 400 }
      )
    }

    const content = await response.text()
    const rollupData = parseRollupData(content)
    const rollupInfo = rollupData.find(rollup => rollup.namespace === targetNamespace)

    if (rollupInfo) {
      return NextResponse.json(rollupInfo, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    return NextResponse.json(
      { error: `No rollup found for namespace ${targetNamespace}` },
      { status: 404 }
    )
  }

  if (query) {
    const searchTerm = decodeURIComponent(query).trim()
    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 })
    }

    const reader = response.body?.getReader()
    const isNumericSearch = /^\d+$/.test(searchTerm)
    const searchPattern = isNumericSearch 
      ? new RegExp(`new k\\((${searchTerm}),"([^"]+)",new URL\\("([^"]+)"\\),new URL\\("([^"]+)"\\)\\)`)
      : new RegExp(`new k\\(([^,]+),"(${searchTerm.toLowerCase()})",new URL\\("([^"]+)"\\),new URL\\("([^"]+)"\\)\\)`, 'i')

    let buffer = ''

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += new TextDecoder().decode(value)
      const match = searchPattern.exec(buffer)

      if (match) {
        const [, namespace, name, website, scan] = match
        return NextResponse.json({
          namespace: parseInt(namespace),
          name,
          website,
          scan
        })
      }
    }

    return NextResponse.json({ error: `No rollup found for "${searchTerm}"` }, { status: 404 })
  }

  return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
}