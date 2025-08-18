# ComposableScan Optimization Rollback Documentation

This document captures the exact current state of all files before optimization changes for easy rollback if needed.

## Files Modified in Optimization

### 1. /src/components/search/interface.tsx
- **Current State**: Contains live streaming functionality with WebSocket connections
- **Live Streaming**: Lines 38-367 implement WebSocket-based live block streaming
- **Magic Numbers**: Hard-coded values like 300ms debounce, 10 blocks limit, 1000 recent blocks
- **[object Promise] Risk**: getRollupName() calls in lines 183, 220 may cause async display issues
- **Dead Code**: clearBlockCache reference potential, unused search functions

### 2. /src/services/ws/stream.ts  
- **Current State**: Full WebSocket implementation for live block streaming
- **Functionality**: EspressoBlockStream class with reconnection logic
- **Will be removed**: Entire file will be eliminated as part of removing live streaming

### 3. /src/components/search/stats.tsx
- **Current State**: Shows live network stats with streaming indicators
- **Live Indicators**: LIVE badge, WiFi status icons for streaming state
- **Will be simplified**: Remove live streaming UI elements

### 4. /src/services/api/main.ts
- **Current State**: Contains transaction enhancement with 2 API calls
- **Optimization Target**: enhanceTransactionData() function (lines 160-222) makes separate getBlock() call
- **Magic Numbers**: Hard-coded batch sizes, timeouts, limits throughout
- **Dead Code**: Unused search() function, potential clearBlockCache references

### 5. /src/services/api/resolver.ts
- **Current State**: Rollup name resolution with async getRollupName()
- **[object Promise] Source**: getRollupName() returns Promise that may display as [object Promise]
- **Will be fixed**: Ensure proper await handling in display components

### 6. /src/services/api/discovery.ts
- **Current State**: Network data fetching and caching
- **Multi-network**: Contains abstractions for multiple networks
- **Will be simplified**: Remove multi-network support, mainnet-only

### 7. /src/contexts/networkcontext.tsx
- **Current State**: Network switching context
- **Multi-network**: Support for switching between different networks
- **Will be simplified**: Mainnet-only, remove network switching

### 8. /src/hooks/useNet.ts
- **Current State**: Network data hooks with polling
- **Over-engineering**: Complex network state management
- **Will be simplified**: Basic data fetching without complex state

## Magic Numbers Identified
- 300ms debounce timeout
- 10 recent blocks limit
- 1000 block history limit
- 100 transaction batch size
- 5 second polling intervals
- 2000ms API timeouts

## Dead Code Identified
- clearBlockCache function references
- Unused search() function in main.ts
- Multi-network abstractions for single network use
- Complex reconnection logic for WebSocket
- Redundant API wrapper functions

## Rollback Instructions

If rollback is needed:

1. **Restore from Git**: If committed, use `git revert` on the optimization commit
2. **Manual Restoration**: Copy the exact file contents documented above
3. **Key Dependencies**: Ensure WebSocket streaming is fully restored in interface.tsx
4. **Test Points**: Verify live streaming, search functionality, and namespace display work

## Current Functionality Working
- Block search by height ✓
- Transaction search by hash ✓  
- Namespace search with rollup names ✓
- Live streaming with WebSocket ✓
- Network stats display ✓
- Search type auto-detection ✓

## Known Issues Before Optimization
- [object Promise] appears in namespace display occasionally
- Live streaming may cause performance issues
- Multiple unnecessary API calls for single operations
- Magic numbers scattered throughout codebase
- Over-engineered multi-network support for single network

---
**Created**: 2025-08-17 before optimization implementation
**Purpose**: Enable easy rollback if optimization causes regressions