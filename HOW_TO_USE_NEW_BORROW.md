# How to Use `useMorphoBorrowNew`

## Key Differences from Old Implementation

### ✅ **What's Fixed:**

1. **No `validateClients()` on allowance check** - Only validates what's needed for read operations
2. **Clear step-by-step flow** - Each step logs extensively
3. **Explicit approval handling** - Always checks and approves if needed
4. **Event verification** - Checks that transactions actually emit events (confirms they did something)
5. **Better error messages** - Specific errors for each failure mode

### 📊 **Expected Console Output:**

```javascript
============================================================
🚀 STARTING MORPHO BORROW FLOW
============================================================
Market: 0x2fb14719030835b8e0a39a1461b384ad6a9c8392550197a7c857cf9fcbd6c534
Collateral: 0.001 wETH
Borrow: 1 USDC
============================================================

📊 Parsed amounts:
  Collateral: 1000000000000000 units
  Borrow: 1000000 units

📋 Checking allowance...
  Token: 0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62
  Spender: 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb
  Amount needed: 1000000000000000
  Current allowance: 0
⚠️ Approval required

🔐 STEP 1: Approving collateral token...
  Token: 0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62
  Spender: 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb
  Amount: 1000000000000000
  📝 Approval tx sent: 0xabc...
  ⏳ Waiting for confirmation...
  ✅ Approval confirmed!

💰 STEP 2: Supplying collateral...
  Market params: {
    loanToken: '0x203A662b0BD271A6ed5a60EdFbd04bFce608FD36',
    collateralToken: '0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62',
    ...
  }
  Amount: 1000000000000000
  On behalf: 0x077b5f9839c00bCa6eD8e5F2717E6e202ef517c9
  📝 Supply tx sent: 0xdef...
  ⏳ Waiting for confirmation...
  Receipt status: success
  Gas used: 27430
  Logs emitted: 2
  ✅ Collateral supplied successfully!
  📊 Events emitted: 2

💸 STEP 3: Borrowing assets...
  Market params: {...}
  Borrow amount: 1000000
  Shares: 0 (using assets)
  On behalf: 0x077b5f9839c00bCa6eD8e5F2717E6e202ef517c9
  Receiver: 0x077b5f9839c00bCa6eD8e5F2717E6e202ef517c9
  📝 Borrow tx sent: 0x123...
  ⏳ Waiting for confirmation...
  Receipt status: success
  Gas used: 27910
  Logs emitted: 1
  ✅ Borrow successful!
  📊 Events emitted: 1

============================================================
✅ BORROW FLOW COMPLETE!
   Transaction hash: 0x123...
============================================================
```

## How to Replace in BorrowForm.tsx

### **Step 1: Import the new hook**

Replace:
```typescript
import { useMorphoBorrow } from "@/hooks/lend-morpho/useMorphoBorrow";
```

With:
```typescript
import { useMorphoBorrowNew } from "@/hooks/lend-morpho/useMorphoBorrowNew";
```

### **Step 2: Use the new hook**

Replace:
```typescript
const morphoBorrow = useMorphoBorrow();
```

With:
```typescript
const morphoBorrow = useMorphoBorrowNew();
```

### **Step 3: Update handleBorrow**

The new hook is **much simpler** - it handles approval automatically!

Replace the entire `handleBorrow` function with:
```typescript
const handleBorrow = async () => {
  console.log("=== handleBorrow CALLED ===");
  console.log("React State - collateralAmount:", collateralAmount);
  console.log("React State - borrowAmount:", borrowAmount);

  if (!collateralAmount || !borrowAmount) {
    console.log("Missing amounts, returning early");
    return;
  }

  // Convert amounts based on input mode
  const tokenBorrowAmount = getBorrowTokenAmount();

  // Call the new hook - it handles approval, supply, and borrow automatically
  const success = await morphoBorrow.borrow({
    market,
    collateralAmount,
    borrowAmount: tokenBorrowAmount.toString(),
  });

  if (success) {
    console.log("Borrow successful, resetting form");
    setCollateralAmount("");
    setBorrowAmount("");
  }
};
```

### **Step 4: Remove approval logic**

You can **delete** these:
- `tokenApproval` hook usage
- `handleApprove` function
- Approval button conditional logic

The new hook handles approval internally!

### **Step 5: Simplify BorrowActionButton**

Change:
```typescript
onBorrow={tokenApproval.isApproved ? handleBorrow : handleApprove}
```

To:
```typescript
onBorrow={handleBorrow}
```

## State Properties

The new hook exposes:

```typescript
{
  borrow: (params) => Promise<boolean>,  // Main function
  reset: () => void,                      // Reset state
  isLoading: boolean,                     // Overall loading state
  error: string | null,                   // Error message
  txHash: string | null,                  // Final borrow tx hash
  step: "idle" | "approving" | "supplying" | "borrowing" | "complete"
}
```

## Testing

1. **Test with UI** - Should see 3 MetaMask popups:
   - Approve collateral
   - Supply collateral
   - Borrow assets

2. **Check console** - Should see detailed step-by-step logs

3. **Verify on-chain** - Position should exist with correct amounts

## Debugging

If you see:
```
⚠️ Transaction succeeded but no events emitted
This may indicate the operation had no effect
```

This means:
- Transaction didn't revert
- But no state change occurred
- Usually means insufficient allowance or balance

The new hook **detects this** and returns `false` instead of claiming success!
