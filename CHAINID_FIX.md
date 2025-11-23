# ChainId Fix for Morpho Hooks

## The Problem

Hooks were missing `chainId` parameter when calling `usePublicClient()`, causing transactions to succeed but have no blockchain effect (empty event logs).

## Files That Need Fixing

### 1. ✅ `useMorphoBorrow.ts` - ALREADY FIXED
Lines 88-89 already have:
```typescript
const { address, isConnected, chainId } = useAccount();
const publicClient = usePublicClient({ chainId });
```

### 2. ✅ `useMorphoBorrowNew.ts` - FIXED

**Line 85-87** has been updated to:
```typescript
const { address, isConnected, chainId } = useAccount();
const publicClient = usePublicClient({ chainId });
const { data: walletClient } = useWalletClient();
```

This hook is now correctly using the dynamic chainId from the user's wallet connection.

### 3. ❌ `useMorphoRepay.ts` - NEEDS FIX

**Line 88-90**, change from:
```typescript
const { address, isConnected } = useAccount();
const publicClient = usePublicClient();
const { data: walletClient } = useWalletClient();
```

**To:**
```typescript
const { address, isConnected, chainId } = useAccount();
const publicClient = usePublicClient({ chainId });
const { data: walletClient } = useWalletClient();
```

## Why This Matters

- **Without chainId:** publicClient uses wrong/default RPC → transactions succeed in wallet but don't affect blockchain
- **With chainId:** publicClient uses Katana (747474) RPC → transactions actually execute on-chain
- **Result:** Event logs populated, position created, everything works

## Test After Fix

You should see:
```javascript
Supply receipt: {
  status: "success",
  logs: [Array(2)],        // ✅ Events emitted!
  logsBloom: "0x0000...1"  // ✅ Non-zero
}

Borrow receipt: {
  status: "success",
  logs: [Array(1)],        // ✅ Events emitted!
  logsBloom: "0x0000...1"  // ✅ Non-zero
}
```

Position will be created on-chain and GraphQL will return data.
