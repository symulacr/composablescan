interface NetworkConfig {
  name: string
  apiBaseUrl: string
  apiVersion: string
  wsBaseUrl: string
  scanBaseUrl: string
  webWorkerUrl: string
}

if (typeof window === 'undefined') {
  const required = [
    'NEXT_PUBLIC_MAINNET_API_BASE_URL',
    'NEXT_PUBLIC_MAINNET_API_VERSION', 
    'NEXT_PUBLIC_MAINNET_WS_BASE_URL',
    'NEXT_PUBLIC_MAINNET_SCAN_BASE_URL',
    'NEXT_PUBLIC_MAINNET_WEB_WORKER_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const config = {
  MAINNET_API_BASE_URL: process.env.NEXT_PUBLIC_MAINNET_API_BASE_URL!,
  MAINNET_API_VERSION: process.env.NEXT_PUBLIC_MAINNET_API_VERSION!,
  MAINNET_WS_BASE_URL: process.env.NEXT_PUBLIC_MAINNET_WS_BASE_URL!,
  MAINNET_SCAN_BASE_URL: process.env.NEXT_PUBLIC_MAINNET_SCAN_BASE_URL!,
  MAINNET_WEB_WORKER_URL: process.env.NEXT_PUBLIC_MAINNET_WEB_WORKER_URL!,
  CURRENT_NETWORK: process.env.NEXT_PUBLIC_NETWORK || 'mainnet',
  NETWORK_STATS_REFRESH_MS: parseInt(process.env.NEXT_PUBLIC_NETWORK_STATS_REFRESH_MS || '30000')
}

const MAINNET_CONFIG: NetworkConfig = {
  name: 'Mainnet',
  apiBaseUrl: config.MAINNET_API_BASE_URL,
  apiVersion: config.MAINNET_API_VERSION,
  wsBaseUrl: config.MAINNET_WS_BASE_URL,
  scanBaseUrl: config.MAINNET_SCAN_BASE_URL,
  webWorkerUrl: config.MAINNET_WEB_WORKER_URL
}

export const getCurrentNetworkConfig = (): NetworkConfig => {
  return MAINNET_CONFIG
}

export const getApiUrl = (endpoint: string): string => {
  const network = getCurrentNetworkConfig()
  return `${network.apiBaseUrl}/${network.apiVersion}${endpoint}`
}

export const getWebSocketUrl = (endpoint: string): string => {
  const network = getCurrentNetworkConfig()
  return `${network.wsBaseUrl}/${network.apiVersion}${endpoint}`
}

export const getScanUrl = (path: string): string => {
  const network = getCurrentNetworkConfig()
  return `${network.scanBaseUrl}${path}`
}

export const getWebWorkerUrl = (): string => {
  const network = getCurrentNetworkConfig()
  return network.webWorkerUrl
}

export const getNetworkStatsRefreshMs = (): number => {
  return config.NETWORK_STATS_REFRESH_MS
}

export { config }