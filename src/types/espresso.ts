
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

export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_RECENT_BLOCKS = 10;
export const MAX_BLOCK_HISTORY = 1000;
export const MAX_BLOCK_TIMES = 500;

export const DEFAULT_BATCH_SIZE = 100;
export const MAX_BATCH_SIZE = 100;
export const API_TIMEOUT_MS = 2000;
export const POLLING_INTERVAL_MS = 5000;
export const NETWORK_STATS_REFRESH_MS = 30000;

export const WS_MAX_RECONNECT_ATTEMPTS = 5;
export const WS_INITIAL_RECONNECT_DELAY_MS = 1000;
export const WS_MAX_RECONNECT_DELAY_MS = 10000;
export const WS_RESET_DELAY_MS = 30000;

export const MIN_VALID_BLOCK_TIME_SECONDS = 1;
export const MAX_VALID_BLOCK_TIME_SECONDS = 300;

export const BASE64_HASH_LENGTH = 44;
export const HEX_HASH_LENGTH = 64;
export const MAX_BLOCK_HEIGHT_DIGITS = 12;
export const MIN_NAMESPACE_DIGITS = 13;
export const MAX_NAMESPACE_DIGITS = 15;

export const DEFAULT_HASH_DISPLAY_LENGTH = 10;
export const DEFAULT_TX_DISPLAY_LENGTH = 20;
export const MIN_SEARCH_LENGTH = 1;
export const MIN_SEARCH_LENGTH_NON_NUMERIC = 2;

export const NETWORK_NAME = 'MAINNET';
export const DEFAULT_BLOCK_TIME_SECONDS = 12;

export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = 1024 * 1024;
export const BYTES_PER_GB = 1024 * 1024 * 1024;