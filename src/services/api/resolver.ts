
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
  const response = await fetch(WEB_WORKER_PROXY_URL);
  
  if (!response.ok) {
    return [];
  }
  
  const content = await response.text();
  const rollupData = parseRollupData(content);
  
  if (rollupData.length === 0) {
    return [];
  }
  
  return rollupData;
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
  
  rollupList = await fetchRollupMetadata();
  rollupMapping = createRollupMapping(rollupList);
  
  isLoading = false;
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
  const response = await fetch(`/api/rollup?namespace=${targetNamespace}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    return null;
  }
  
  const rollupInfo = await response.json();
  return rollupInfo;
}


export async function universalRollupSearch(query: string): Promise<RollupInfo[]> {
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
    return [];
  }
  
  const result = await response.json();
  
  const rollups = Array.isArray(result) ? result : [result];
  
  return rollups;
}

export function getAllRollups(): RollupInfo[] {
  return rollupList || [];
}

export function isRollupResolverReady(): boolean {
  return rollupMapping !== null;
}


