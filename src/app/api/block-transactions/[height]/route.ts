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

interface BatchTransaction {
  hash: string;
  rollups: number[];
  height: number;
  offset: number;
  time: string;
}

interface BatchRequest {
  offset: number;
  limit: number;
}

function calculateBatches(totalTxs: number, batchSize: number = 100): BatchRequest[] {
  const batches: BatchRequest[] = [];
  for (let offset = 0; offset < totalTxs; offset += batchSize) {
    batches.push({
      offset,
      limit: Math.min(batchSize, totalTxs - offset)
    });
  }
  return batches;
}

async function fetchBatch(height: number, offset: number, limit: number): Promise<BatchTransaction[]> {
  const url = `https://query.main.net.espresso.network/v0/explorer/transactions/from/${height}/${offset}/${limit}/block/${height}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.transaction_summaries || [];
  } catch (error) {
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ height: string }> }
) {
  try {
    const { height } = await params
    const blockHeight = parseInt(height);
    
    if (!blockHeight || isNaN(blockHeight) || blockHeight < 1) {
      return NextResponse.json(
        { error: 'Invalid block height' },
        { status: 400 }
      )
    }
    
    const { getApiUrl } = await import('@/lib/config')
    
    const blockApiUrl = getApiUrl('/availability/block/' + height)
    const blockResponse = await fetch(blockApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!blockResponse.ok) {
      return NextResponse.json(
        { error: `Block ${height} not found` },
        { status: blockResponse.status }
      )
    }
    
    const blockData = await blockResponse.json()
    const totalTxs = blockData.num_transactions || 0
    
    if (totalTxs === 0) {
      return NextResponse.json(
        { 
          transactions: [],
          total_transactions: 0,
          returned_transactions: 0
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }
    
    const batches = calculateBatches(totalTxs, 100);
    
    const promises = batches.map(batch => 
      fetchBatch(blockHeight, batch.offset, batch.limit)
    );
    
    const results = await Promise.allSettled(promises);
    const allTransactions: BatchTransaction[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allTransactions.push(...result.value);
      } else {
      }
    });
    
    const sortedTransactions = allTransactions.sort((a, b) => b.offset - a.offset);
    
    const transactions = sortedTransactions.map(tx => ({
      hash: tx.hash,
      index: tx.offset,
      namespace: tx.rollups[0] || 0
    }));
    
    return NextResponse.json(
      { 
        transactions,
        total_transactions: totalTxs,
        returned_transactions: transactions.length,
        batches_processed: batches.length
      },
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
      { error: 'Failed to fetch block transactions' },
      { status: 500 }
    )
  }
}