import { getCurrentNetworkConfig, getApiUrl } from '@/lib/config'
import { makeApiCall, getLatestBlockHeight } from './discovery'
import { 
  DEFAULT_BATCH_SIZE, 
  MAX_BATCH_SIZE, 
  DEFAULT_BLOCK_TIME_SECONDS,
  DEFAULT_HASH_DISPLAY_LENGTH,
  DEFAULT_TX_DISPLAY_LENGTH,
  BYTES_PER_KB,
  BYTES_PER_MB,
  BYTES_PER_GB
} from '@/types/espresso'

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

    const hashForApi = hash.startsWith('BLOCK~') ? hash : `BLOCK~${hash}`;
    
    const blockHashUrl = getApiUrl(`/availability/block/hash/${encodeURIComponent(hashForApi)}`)
    const response = await makeApiCall(blockHashUrl);
    
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




export async function getBlock(height: number) {

  if (!height || isNaN(height) || height < 1) {
    throw new Error(`Invalid block height: ${height}`)
  }
  
  try {
    const blockSummaryUrl = getApiUrl(`/availability/block/${height}`)
    const response = await makeApiCall(blockSummaryUrl)
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



export async function getTransactionByHash(hash: string) {
  try {

    const hashForApi = hash.startsWith('TX~') ? hash : `TX~${hash}`;
    
    const transactionUrl = getApiUrl(`/availability/transaction/hash/${encodeURIComponent(hashForApi)}`)
    const response = await makeApiCall(transactionUrl);
    
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
  
  const blockHash = null;
  const timestamp = null;
  

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



export async function getNamespaceTransactions(height: number, namespace: number) {
  try {
    const namespaceUrl = getApiUrl(`/availability/block/${height}/namespace/${namespace}`)
    const response = await makeApiCall(namespaceUrl);
    
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

function calculateBatches(totalTxs: number, batchSize: number = DEFAULT_BATCH_SIZE): BatchRequest[] {
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
  const url = getApiUrl(`/explorer/transactions/from/${height}/${offset}/${limit}/block/${height}`);
  
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
    
    const batches = calculateBatches(totalTxs, MAX_BATCH_SIZE);
    
    const batchTransactions = await fetchAllBatches(height, batches);
    
    const sortedTransactions = sortTransactions(batchTransactions);
    
    return sortedTransactions.map(processTransactionSummary);
    
  } catch (error) {
    throw error;
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
      

      const latestBlockHeight = await getLatestBlockHeight();
      
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

export function formatTransactionHash(hash: string, length: number = DEFAULT_HASH_DISPLAY_LENGTH): string {
  if (hash.length <= length) return hash;
  return `${hash.substring(0, length)}...`;
}

export function formatBlockSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < BYTES_PER_KB) return `${bytes} B`;
  if (bytes < BYTES_PER_MB) return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
  if (bytes < BYTES_PER_GB) return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
  return `${(bytes / BYTES_PER_GB).toFixed(1)} GB`;
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

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)}${units[unitIndex]}`
}