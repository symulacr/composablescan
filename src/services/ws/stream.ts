
import { getWebSocketUrl } from '../../lib/config'
import { getLatestBlockHeight } from '../api/discovery'
export interface StreamingBlock {
  height: number;
  transactions: number;
  timestamp: number;
  size: number;
  hash?: string;
}

export interface StreamingStats {
  latestBlock: number;
  totalTransactions: number;
  avgBlockTime: number;
  isConnected: boolean;
  recentBlocks: StreamingBlock[];
}

export class EspressoBlockStream {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onBlockCallback: ((block: StreamingBlock) => void) | null = null;
  private onStatsCallback: ((stats: StreamingStats) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private startHeight: number | null = null;
  private recentBlocks: StreamingBlock[] = [];
  private blockTimes: number[] = [];

  constructor() {

  }

  async connect() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('WebSocket not supported'));
      }
      return;
    }
    
    const latestHeight = await getLatestBlockHeight();
    this.startHeight = latestHeight;
    
    const wsUrl = getWebSocketUrl(`/availability/stream/blocks/${latestHeight}`);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {

      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const blockData = JSON.parse(event.data);
          

          const streamingBlock: StreamingBlock = {
            height: blockData.header?.fields?.height || 0,
            transactions: blockData.num_transactions || 0,
            timestamp: blockData.header?.fields?.timestamp || 0,
            size: blockData.size || 0,
            hash: blockData.hash
          };

          if (streamingBlock.height > 0) {

            const latestHeight = this.recentBlocks.length > 0 ? this.recentBlocks[0].height : 0;
            if (streamingBlock.height <= latestHeight) {

              return;
            }
            

            this.recentBlocks = [streamingBlock, ...this.recentBlocks].slice(0, 1000);
            

            if (this.recentBlocks.length >= 5) {
              const currentBlock = this.recentBlocks[0];
              const previousBlock = this.recentBlocks[1];
              
              const currentTime = currentBlock.timestamp;
              const previousTime = previousBlock.timestamp;
              

              if (currentTime > previousTime && currentTime > 0 && previousTime > 0) {
                const blockTime = currentTime - previousTime;
                const heightDiff = currentBlock.height - previousBlock.height;
                
                if (heightDiff === 1) {

                  if (blockTime >= 1 && blockTime <= 300) {
                    this.blockTimes = [blockTime, ...this.blockTimes].slice(0, 500);
                  } else {

                  }
                } else if (heightDiff > 1) {

                } else {

                }
              } else {

              }
            }


            const avgTxnsPerBlock = this.recentBlocks.length > 0 
              ? Math.round(this.recentBlocks.reduce((sum, block) => sum + block.transactions, 0) / this.recentBlocks.length)
              : 0;
            
            const avgBlockTime = this.blockTimes.length > 0 
              ? Math.round(this.blockTimes.reduce((sum, time) => sum + time, 0) / this.blockTimes.length)
              : 0;
            
            
            const stats: StreamingStats = {
              latestBlock: streamingBlock.height,
              totalTransactions: avgTxnsPerBlock,
              avgBlockTime: avgBlockTime,
              isConnected: this.isConnected(),
              recentBlocks: this.recentBlocks
            };

            if (this.onBlockCallback) {
              this.onBlockCallback(streamingBlock);
            }

            if (this.onStatsCallback) {
              this.onStatsCallback(stats);
            }
          } else {

          }
      };

      this.ws.onerror = (error) => {


        if (this.onErrorCallback) {
          this.onErrorCallback(new Error(`WebSocket connection failed for mainnet`));
        }
      };

      this.ws.onclose = (event) => {


        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else if (event.code !== 1000) {

          if (this.onErrorCallback) {
            this.onErrorCallback(new Error(`WebSocket connection permanently failed for mainnet`));
          }
        }
      };

  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {


      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.attemptReconnect();
      }, 30000);
      return;
    }

    this.reconnectAttempts++;

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 10000);
    

    
    setTimeout(async () => {
      await this.connect();
    }, delay);
  }

  onBlock(callback: (block: StreamingBlock) => void) {
    this.onBlockCallback = callback;
  }

  onStats(callback: (stats: StreamingStats) => void) {
    this.onStatsCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  getStats(): StreamingStats {

    const avgTxnsPerBlock = this.recentBlocks.length > 0 
      ? Math.round(this.recentBlocks.reduce((sum, block) => sum + block.transactions, 0) / this.recentBlocks.length)
      : 0;
    
    const avgBlockTime = this.blockTimes.length > 0 
      ? Math.round(this.blockTimes.reduce((sum, time) => sum + time, 0) / this.blockTimes.length)
      : 0;
    
    return {
      latestBlock: this.recentBlocks[0]?.height || 0,
      totalTransactions: avgTxnsPerBlock,
      avgBlockTime: avgBlockTime,
      isConnected: this.isConnected(),
      recentBlocks: this.recentBlocks
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = this.maxReconnectAttempts;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}


let globalStream: EspressoBlockStream | null = null;

export function getBlockStream(): EspressoBlockStream {
  if (!globalStream) {
    globalStream = new EspressoBlockStream();
  }
  return globalStream;
}