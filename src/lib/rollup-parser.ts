export interface RollupInfo {
  namespace: number
  name: string
  website: string
  scan: string
}

export function parseRollupData(content: string): RollupInfo[] {
  const rollupData: RollupInfo[] = []
  const regex = /new k\(([^,]+),"([^"]+)",new URL\("([^"]+)"\),new URL\("([^"]+)"\)\)/g
  let match
  
  while ((match = regex.exec(content)) !== null) {
    const [, namespaceStr, name, website, scan] = match
    const namespace = parseInt(namespaceStr)
    
    if (!isNaN(namespace)) {
      rollupData.push({ namespace, name, website, scan })
    }
  }
  
  return rollupData
}