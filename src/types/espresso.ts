// Espresso Network data types

export interface EspressoBlock {
  height: number;
  hash?: string;
  timestamp: number;
  size?: number;
  transactions?: number;
  proposer_id?: string[];
  fee_recipient?: string[];
  block_reward?: string[];
}

export interface EspressoTransaction {
  hash: string;
  block_height: number;
  index: number;
  size?: number;
  namespace?: number;
  rollup_name?: string;
  timestamp?: number;
  sender?: string;
  block_hash?: string;
  human_readable_time?: string;
  source?: string;
  tx_size_bytes?: number;
}

export interface EspressoNamespace {
  namespace: number;
  name?: string;
  transactions: EspressoTransaction[];
  rollup_info?: RollupInfo;
}

export interface RollupInfo {
  namespace: number;
  name: string;
  site?: string;
  blockScan?: string;
}

export interface SearchResult {
  id: string;
  type: 'block' | 'transaction' | 'rollup' | 'namespace';
  label: string;
  description?: string;
  time?: string;
  data?: EspressoBlock | EspressoTransaction | EspressoNamespace;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type SearchType = 'block' | 'transaction' | 'namespace' | 'rollup_name' | 'block_hash' | 'block_or_namespace' | 'invalid';

export interface NetworkInfo {
  name: string;
  baseUrl: string;
  version: string;
}