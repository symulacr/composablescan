import { NextRequest, NextResponse } from 'next/server'


import { getApiUrl } from '@/lib/config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params
    

    const cleanHash = hash.startsWith('TX~') ? hash.substring(3) : hash
    const hashForApi = `TX~${cleanHash}`
    
    const apiUrl = getApiUrl(`/availability/transaction/hash/${encodeURIComponent(hashForApi)}`)
    

    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {

      return NextResponse.json(
        { error: `Transaction not found: ${hash}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()

    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
    
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}