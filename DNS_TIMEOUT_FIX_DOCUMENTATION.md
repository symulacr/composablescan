# DNS Timeout Fix Documentation

## Current State (Before Changes)

### Automatic Rollup Initialization Locations:
1. **src/components/search/interface.tsx** (lines 320-321):
   ```typescript
   useEffect(() => {
     initializeRollupResolver().catch(() => {})
   }, [currentNetwork])
   ```

2. **src/services/api/resolver.ts** (lines 168-170):
   ```typescript
   if (typeof window !== 'undefined') {
     initializeRollupResolver();
   }
   ```

### DNS Timeout Issue:
- **src/app/api/rollup-worker/route.ts** (line 4):
   ```typescript
   const response = await fetch(getWebWorkerUrl())
   ```
   - No error handling, causing 10-second DNS hangs on failure

### Current Loading Behavior:
- Rollup resolver initializes automatically on:
  - Page load (via browser-side init in resolver.ts)
  - Network changes (via useEffect in interface.tsx)
- This causes immediate DNS calls to external rollup services
- Block and transaction endpoints are preserved and working correctly

## Changes Applied (Using "Less is More" Philosophy):

### 1. DNS Error Handling Fix
- **Modified src/app/api/rollup-worker/route.ts**:
  ```typescript
  export async function GET() {
    try {
      const response = await fetch(getWebWorkerUrl())
      if (!response.ok) {
        return new Response('Rollup service unavailable', { status: 503 })
      }
      return new Response(await response.text())
    } catch {
      return new Response('Rollup service unavailable', { status: 503 })
    }
  }
  ```
  - Added proper error handling without timeouts
  - Returns graceful 503 response on DNS failure

### 2. Removed Automatic Initialization
- **Removed from src/components/search/interface.tsx** (lines 320-321):
  ```typescript
  // REMOVED: useEffect(() => {
  //   initializeRollupResolver().catch(() => {})
  // }, [currentNetwork])
  ```

- **Removed from src/services/api/resolver.ts** (lines 168-170):
  ```typescript
  // REMOVED: if (typeof window !== 'undefined') {
  //   initializeRollupResolver();
  // }
  ```

### 3. Made Rollup Loading On-Demand
- **Modified src/services/api/resolver.ts getRollupName function**:
  ```typescript
  export async function getRollupName(namespace: number): Promise<string | null> {
    if (!rollupMapping && !isLoading) {
      try {
        await initializeRollupResolver();
      } catch {
        return null;
      }
    }
    // ... rest of function
  }
  ```
  - Automatically initializes rollup resolver only when needed
  - Gracefully handles initialization failures

- **Updated calls in src/components/search/interface.tsx**:
  ```typescript
  const rollupName = await getRollupName(blockHeight)  // Made async
  const rollupName = await getRollupName(namespaceId)  // Made async
  ```

### 4. Preserved Functionality
- Block TX and TX of block endpoints completely unchanged
- Search functionality preserved - rollup data loads on-demand
- All existing search patterns maintained
- Page load: Only block height + stream API (no rollup DNS calls)

## Rollback Instructions:
To revert these changes:

1. **Restore automatic initialization in src/components/search/interface.tsx**:
   ```typescript
   useEffect(() => {
     initializeRollupResolver().catch(() => {})
   }, [currentNetwork])
   ```

2. **Restore global initialization in src/services/api/resolver.ts**:
   ```typescript
   if (typeof window !== 'undefined') {
     initializeRollupResolver();
   }
   ```

3. **Revert src/services/api/resolver.ts getRollupName to sync**:
   ```typescript
   export function getRollupName(namespace: number): string | null {
     if (!rollupList || rollupList.length === 0) {
       return null;
     }
     const rollup = rollupList.find(r => r.namespace === namespace);
     return rollup ? rollup.name : null;
   }
   ```

4. **Update calls back to sync in src/components/search/interface.tsx**:
   ```typescript
   const rollupName = getRollupName(blockHeight)    // Remove await
   const rollupName = getRollupName(namespaceId)    // Remove await
   ```

5. **Revert src/app/api/rollup-worker/route.ts**:
   ```typescript
   export async function GET() {
     const response = await fetch(getWebWorkerUrl())
     return new Response(await response.text())
   }
   ```

## Expected Impact:
- **Eliminates 10-second DNS hangs on page load** - Fixed via error handling + on-demand loading
- **Faster initial page load** - No automatic rollup DNS calls
- **Rollup functionality still works** - Loads automatically when user searches namespaces/rollup names
- **Maintains all existing search capabilities** - Block, transaction, and rollup search unchanged
- **Philosophy: "Less is More"** - Reduced code complexity, removed automatic loading