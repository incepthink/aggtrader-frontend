# URGENT: ChainId Fix Required for useMorphoRepay.ts

## Status
- ✅ useMorphoBorrow.ts - ALREADY FIXED (lines 88-89)
- ✅ useMorphoBorrowNew.ts - JUST FIXED (lines 85-87)
- ❌ useMorphoRepay.ts - NEEDS MANUAL FIX (lines 88-90)

## File: src/hooks/lend-morpho/useMorphoRepay.ts

### Lines 88-90 Current Code (WRONG):
```typescript
const { address, isConnected } = useAccount();
const publicClient = usePublicClient();
const { data: walletClient } = useWalletClient();
```

### Required Fix:
```typescript
const { address, isConnected, chainId } = useAccount();
const publicClient = usePublicClient({ chainId });
const { data: walletClient } = useWalletClient();
```

## Why This Is Critical

Without `chainId` parameter:
- `publicClient` uses default/wrong RPC endpoint
- Transactions succeed in wallet but don't affect blockchain
- Event logs remain empty: `logs: []`, `logsBloom: "0x0000..."`
- Position is NOT created on-chain

With `chainId` parameter:
- `publicClient` uses correct Katana (747474) RPC endpoint
- Transactions actually execute on-chain
- Event logs populated with transaction events
- Position created successfully

## How to Apply

**Option 1: Manual Edit**
1. Open `src/hooks/lend-morpho/useMorphoRepay.ts`
2. Go to lines 88-90
3. Add `, chainId` after `isConnected`
4. Add `{ chainId }` parameter to `usePublicClient()`
5. Save file

**Option 2: Command Line**
```bash
# Backup first
cp src/hooks/lend-morpho/useMorphoRepay.ts src/hooks/lend-morpho/useMorphoRepay.ts.backup

# Apply fix (on Windows Git Bash)
sed -i 's/const { address, isConnected } = useAccount();/const { address, isConnected, chainId } = useAccount();/' src/hooks/lend-morpho/useMorphoRepay.ts
sed -i 's/const publicClient = usePublicClient();/const publicClient = usePublicClient({ chainId });/' src/hooks/lend-morpho/useMorphoRepay.ts
```

## Verification

After applying the fix, you should see in console logs:
```javascript
publicClient: PublicClient {
  chain: { id: 747474, name: 'Katana' },
  transport: http({ url: 'https://rpc.katana.network/' })
}
```

## Test After Fix

Run a borrow transaction and check receipt:
```javascript
{
  status: "success",
  logs: [Array(2)],        // ✅ Should have events
  logsBloom: "0x0000...1"  // ✅ Should be non-zero
}
```
