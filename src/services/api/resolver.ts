
interface RollupInfo {
  namespace: number;
  name: string;
  website: string;
  scan: string;
}

import { parseRollupData } from '@/lib/rollup-parser'

interface RollupMapping {
  [rollupName: string]: number;
}

let rollupMapping: RollupMapping | null = null;
let rollupList: RollupInfo[] = [];
let isLoading = false;

const WEB_WORKER_PROXY_URL = '/api/rollup?raw=true';

async function fetchRollupMetadata(): Promise<RollupInfo[]> {
  try {
    const response = await fetch(WEB_WORKER_PROXY_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch web worker: ${response.status}`);
    }
    
    const content = await response.text();
    const rollupData = parseRollupData(content);
    
    if (rollupData.length === 0) {
      throw new Error('No rollup data found in web worker - regex pattern may need updating');
    }
    
    return rollupData;
    
  } catch (error) {

    throw new Error(`Rollup metadata fetch failed: ${error}`);
  }
}

function createRollupMapping(rollups: RollupInfo[]): RollupMapping {
  const mapping: RollupMapping = {};
  
  rollups.forEach(rollup => {

    const normalizedName = rollup.name.toUpperCase().trim();
    mapping[normalizedName] = rollup.namespace;
    

    if (normalizedName === 'MOLTEN') {
      mapping['MOLTEN NETWORK'] = rollup.namespace;
    }
    if (normalizedName === 'LOGX') {
      mapping['LOGX NETWORK'] = rollup.namespace;
    }
  });
  
  return mapping;
}

export async function initializeRollupResolver(): Promise<void> {

  if (rollupMapping || isLoading) {
    return;
  }
  
  isLoading = true;
  
  try {
    rollupList = await fetchRollupMetadata();
    rollupMapping = createRollupMapping(rollupList);
  } catch (error) {

    rollupMapping = null;
    throw new Error(`Rollup resolver initialization failed: ${error}`);
  } finally {
    isLoading = false;
  }
}

export function resolveRollupName(rollupName: string): number | null {
  if (!rollupMapping) {
    return null;
  }
  
  const normalizedName = rollupName.toUpperCase().trim();
  return rollupMapping[normalizedName] || null;
}

export function getRollupName(namespace: number): string | null {
  if (!rollupList || rollupList.length === 0) {
    return null;
  }
  

  const rollup = rollupList.find(r => r.namespace === namespace);
  return rollup ? rollup.name : null;
}


export async function findRollupByNamespace(targetNamespace: number): Promise<RollupInfo | null> {
  try {
    const response = await fetch(`/api/rollup?namespace=${targetNamespace}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to search rollup: ${response.status}`);
    }
    
    const rollupInfo = await response.json();
    return rollupInfo;
    
  } catch (error) {

    return null;
  }
}


export async function universalRollupSearch(query: string): Promise<RollupInfo[]> {
  try {
    const searchTerm = query.trim();
    
    if (!searchTerm) {
      return [];
    }
    
    const response = await fetch(`/api/rollup?query=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Failed to search rollup: ${response.status}`);
    }
    
    const result = await response.json();
    

    const rollups = Array.isArray(result) ? result : [result];
    
    return rollups;
    
  } catch (error) {


    return [];
  }
}

export function getAllRollups(): RollupInfo[] {
  return rollupList || [];
}

export function isRollupResolverReady(): boolean {
  return rollupMapping !== null;
}


