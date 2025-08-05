interface NetworkConfig {
  name: string
  apiBaseUrl: string
  apiVersion: string
  wsBaseUrl: string
  scanBaseUrl: string
  webWorkerUrl: string
}

const config = {
  MAINNET_API_BASE_URL: process.env.NEXT_PUBLIC_MAINNET_API_BASE_URL || 'https://query.main.net.espresso.network',
  MAINNET_API_VERSION: process.env.NEXT_PUBLIC_MAINNET_API_VERSION || 'v0',
  MAINNET_WS_BASE_URL: process.env.NEXT_PUBLIC_MAINNET_WS_BASE_URL || 'wss://query.main.net.espresso.network',
  MAINNET_SCAN_BASE_URL: process.env.NEXT_PUBLIC_MAINNET_SCAN_BASE_URL || 'https://explorer.main.net.espresso.network',
  MAINNET_WEB_WORKER_URL: process.env.NEXT_PUBLIC_MAINNET_WEB_WORKER_URL || 'https://explorer.main.net.espresso.network/assets/node_validator_web_worker_api.js-bT9djMJi.js',
  CURRENT_NETWORK: process.env.NEXT_PUBLIC_NETWORK || 'mainnet'
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
export { config }