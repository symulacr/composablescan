import { getCurrentNetworkConfig, getApiUrl } from '@/lib/config'

const MAINNET_CONFIG = getCurrentNetworkConfig();

export const getCurrentNetwork = () => MAINNET_CONFIG;
async function makeOptimizedCall(endpoint: string, filterPayload: boolean = true) {
  const url = getApiUrl(endpoint);
  
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
    

    if (filterPayload && data) {
      if (data.transaction?.payload) {
        delete data.transaction.payload;
      }
      if (data.proof?.payload_proof_tx?.proofs) {
        delete data.proof.payload_proof_tx.proofs;
      }
    }
    
    return data;
  } catch (error) {

    throw error;
  }
}


export async function getBlockByHash(hash: string) {
  try {
    const networkParam = 'mainnet';
    

    const hashForApi = hash.startsWith('BLOCK~') ? hash : `BLOCK~${hash}`;
    
    const response = await fetch(`/api/block-hash/${encodeURIComponent(hashForApi)}?network=${networkParam}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch block with hash ${hash}`);
    }
    
    const blockData = await response.json();
    
    const blockHeight = blockData.header?.fields?.height || 0;
    const blockHash = blockData.hash || hash;
    const timestamp = blockData.header?.fields?.timestamp || 0;
    const sizeBytes = blockData.size || 0;
    const numTransactions = blockData.num_transactions || 0;
    

    return {
      height: blockHeight,
      hash: blockHash,
      timestamp: timestamp,
      size: sizeBytes,
      transactions: numTransactions,
      num_transactions: numTransactions,
      header: blockData.header,
      human_readable_time: formatBlockTime(timestamp),
      human_readable_size: formatBlockSize(sizeBytes),
      l1_head: blockData.header?.fields?.l1_head || null,
      l1_finalized: blockData.header?.fields?.l1_finalized || null,
      chain_id: blockData.header?.fields?.chain_config?.chain_config?.Left?.chain_id || null,
      fee_info: blockData.header?.fields?.fee_info || null,
      builder_commitment: blockData.header?.fields?.builder_commitment || null,
      payload_commitment: blockData.header?.fields?.payload_commitment || null
    };
  } catch (error) {

    throw error;
  }
}


async function makeRobustApiCall(url: string, options?: RequestInit): Promise<Response> {
  const maxRetries = 3
  const baseDelay = 1000
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

      if (!navigator.onLine) {
        throw new Error('No internet connection')
      }
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        }
      })
      
      if (response.ok) {
        return response
      }
      

      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      if (attempt === maxRetries) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      

      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Max retries exceeded')
}


export async function getBlock(height: number) {

  if (!height || isNaN(height) || height < 1) {
    throw new Error(`Invalid block height: ${height}`)
  }
  
  try {
    const networkParam = 'mainnet';
    
    const response = await makeRobustApiCall(`/api/block/${height}?network=${networkParam}`)
    const blockData = await response.json();
    
    const blockHeight = blockData.header?.fields?.height || height;
    const blockHash = blockData.hash || null;
    const timestamp = blockData.header?.fields?.timestamp || 0;
    const sizeBytes = blockData.size || 0;
    const numTransactions = blockData.num_transactions || 0;
    

    return {
      height: blockHeight,
      hash: blockHash,
      timestamp: timestamp,
      size: sizeBytes,
      transactions: numTransactions,
      num_transactions: numTransactions,
      header: blockData.header,
      human_readable_time: formatBlockTime(timestamp),
      human_readable_size: formatBlockSize(sizeBytes),
      l1_head: blockData.header?.fields?.l1_head || null,
      l1_finalized: blockData.header?.fields?.l1_finalized || null,
      chain_id: blockData.header?.fields?.chain_config?.chain_config?.Left?.chain_id || null,
      fee_info: blockData.header?.fields?.fee_info || null,
      builder_commitment: blockData.header?.fields?.builder_commitment || null,
      payload_commitment: blockData.header?.fields?.payload_commitment || null
    };
  } catch (error) {

    throw error;
  }
}

export async function getBlockRange(from: number, to: number) {

  const limit = Math.min(to - from + 1, 100);
  const actualTo = from + limit - 1;
  return makeOptimizedCall(`/availability/block/summaries/${from}/${actualTo}`);
}


export async function getTransactionByHash(hash: string) {
  try {
    const networkParam = 'mainnet';
    

    const hashForApi = hash.startsWith('TX~') ? hash : `TX~${hash}`;
    
    const response = await fetch(`/api/transaction-hash/${encodeURIComponent(hashForApi)}?network=${networkParam}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch transaction with hash ${hash}`);
    }
    
    const rawData = await response.json();
    
    return await enhanceTransactionData(rawData, hash);
  } catch (error) {

    throw error;
  }
}


async function enhanceTransactionData(rawData: any, originalHash: string) {
  if (!rawData || !rawData.transaction) {
    throw new Error('Invalid transaction data');
  }
  
  const transaction = rawData.transaction;
  const blockHeight = transaction.block_height || 0;
  const index = rawData.index || 0;
  const namespace = transaction.namespace;
  

  let blockHash = null;
  let timestamp = null;
  
  if (blockHeight > 0) {
    try {
      const blockData = await getBlock(blockHeight);
      blockHash = blockData.hash;
      timestamp = blockData.timestamp;
    } catch (error) {

    }
  }
  

  let txSizeBytes = null;
  if (transaction.payload) {

    const base64Length = transaction.payload.length;
    txSizeBytes = Math.floor((base64Length * 3) / 4);
  }
  const humanReadableTime = timestamp ? formatBlockTime(timestamp) : null;
  
  return {

    ...rawData,
    

    hash: originalHash,
    block_height: blockHeight,
    index: index,
    namespace: namespace,
    block_hash: blockHash,
    timestamp: timestamp,
    human_readable_time: humanReadableTime,
    tx_size_bytes: txSizeBytes,
    size: txSizeBytes,
    sender: transaction.sender || null,
    

    transaction: {
      ...transaction,
      hash: originalHash,
      block_height: blockHeight,
      index: index,
      namespace: namespace,
      block_hash: blockHash,
      timestamp: timestamp,
      human_readable_time: humanReadableTime,
      tx_size_bytes: txSizeBytes
    }
  };
}

export async function getTransaction(height: number, index: number) {
  return makeOptimizedCall(`/availability/transaction/${height}/${index}`);
}


export async function getNamespaceTransactions(height: number, namespace: number) {
  try {
    const networkParam = 'mainnet';
    
    const response = await fetch(`/api/namespace/${height}/${namespace}?network=${networkParam}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch namespace ${namespace} in block ${height}`);
    }
    
    const namespaceData = await response.json();
    return namespaceData;
    
  } catch (error) {

    throw error;
  }
}

interface Transaction {
  hash: string;
  index: number;
  namespace: number;
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

async function fetchAllBatches(height: number, batches: BatchRequest[]): Promise<BatchTransaction[]> {
  const promises = batches.map(batch => 
    fetchBatch(height, batch.offset, batch.limit)
  );
  
  const results = await Promise.allSettled(promises);
  const allTransactions: BatchTransaction[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allTransactions.push(...result.value);
    } else {
    }
  });
  
  return allTransactions;
}

function sortTransactions(transactions: BatchTransaction[]): BatchTransaction[] {
  return transactions.sort((a, b) => b.offset - a.offset);
}

function processTransactionSummary(tx: BatchTransaction): Transaction {
  return {
    hash: tx.hash,
    namespace: tx.rollups[0] || 0,
    index: tx.offset
  };
}

export async function getBlockTransactionsBatch(height: number): Promise<Transaction[]> {
  try {
    const blockData = await getBlock(height);
    const totalTxs = blockData.num_transactions || 0;
    
    if (totalTxs === 0) {
      return [];
    }
    
    const batches = calculateBatches(totalTxs, 100);
    
    const batchTransactions = await fetchAllBatches(height, batches);
    
    const sortedTransactions = sortTransactions(batchTransactions);
    
    return sortedTransactions.map(processTransactionSummary);
    
  } catch (error) {
    throw error;
  }
}

export async function getBlockTransactions(height: number): Promise<Transaction[]> {
  try {
    const networkParam = 'mainnet';
    
    const response = await makeRobustApiCall(`/api/block-transactions/${height}?network=${networkParam}`);
    const transactionData = await response.json();
    
    if (transactionData && Array.isArray(transactionData.transactions)) {
      return transactionData.transactions
        .filter((tx: any) => tx.hash)
        .map((tx: any, index: number) => ({
          hash: tx.hash,
          index: tx.index !== undefined ? tx.index : index,
          namespace: tx.namespace || tx.transaction?.namespace || 0
        }));
    }
    
    return [];
    
  } catch (error) {
    try {
      const transactions: Transaction[] = [];
      const blockData = await getBlock(height);
      const numTransactions = blockData.num_transactions || 0;
      
      const maxTransactions = Math.min(numTransactions, 50);
      
      for (let i = 0; i < maxTransactions; i++) {
        try {
          const txData = await getTransaction(height, i);
          if (txData && txData.hash) {
            transactions.push({
              hash: txData.hash,
              index: i,
              namespace: txData.transaction?.namespace || 0
            });
          } else {
          }
        } catch (txError) {
          continue;
        }
      }
      
      return transactions;
    } catch (fallbackError) {
      throw error;
    }
  }
}

export async function getHeader(height: number) {
  return makeOptimizedCall(`/availability/header/${height}`, false);
}


export async function getBlockScan(height: number) {
  try {
    return makeOptimizedCall(`/scan/block/${height}`, false);
  } catch (error) {

    return getBlock(height);
  }
}


export async function search(query: string, type: 'block' | 'transaction' | 'namespace' | 'rollup_name') {
  switch (type) {
    case 'block':
      const height = parseInt(query);
      if (isNaN(height) || height < 1) {
        throw new Error('Invalid block height');
      }
      return {
        type: 'block',
        data: await getBlock(height)
      };
      
    case 'transaction':
      if (!query || query.length < 3) {
        throw new Error('Invalid transaction hash');
      }
      return {
        type: 'transaction', 
        data: await getTransactionByHash(query)
      };
      
    case 'namespace':
      const namespaceId = parseInt(query);
      if (isNaN(namespaceId) || namespaceId < 0) {
        throw new Error('Invalid namespace ID');
      }
      

      const { discoverLatestBlock } = await import('./blockdiscovery');
      const latestBlockHeight = await discoverLatestBlock();
      
      return {
        type: 'namespace',
        data: await getNamespaceTransactions(latestBlockHeight, namespaceId)
      };
      
    case 'rollup_name':

      throw new Error('Rollup name search requires real API endpoint');
      
    default:
      throw new Error(`Unknown search type: ${type}`);
  }
}

export function formatBlockTime(timestamp: number | string): string {
  if (!timestamp || timestamp === 0) return 'Unknown';
  
  const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  
  return date.toLocaleDateString();
}

export function formatTransactionHash(hash: string, length: number = 10): string {
  if (hash.length <= length) return hash;
  return `${hash.substring(0, length)}...`;
}

export function formatBlockSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatTransactionSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return 'Unknown';
  return formatBlockSize(bytes);
}

export function formatTransactionTimestamp(timestamp: number | null): string {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

export function getTransactionSource(transaction: any): string {

  if (transaction.namespace !== undefined) {
    return `Namespace ${transaction.namespace}`;
  }
  return 'Espresso Network';
}

export function formatNumber(num: number): string {
  if (!num || isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}