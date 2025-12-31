# Kuma Wallet Integration Setup Guide

This guide explains how to set up and use the Kuma wallet unlock/association flow for perpetual trading.

## Overview

The wallet unlock flow allows users to associate their Web3 wallet with your Kuma API account, enabling them to trade perpetual contracts on the Kuma exchange. This is a **required step** before users can place orders or access private trading data.

## Architecture

### Flow Diagram

```
1. User clicks Buy/Sell on perp page
   ↓
2. Check: Is wallet connected? → No → Open RainbowKit modal
   ↓ Yes
3. Check: Is wallet associated with Kuma? → No → Prompt for signature
   ↓ Yes
4. Execute trade
```

### Key Components

1. **`useKumaAuth` hook** (`src/hooks/perp/useKumaAuth.ts`)
   - Manages Kuma authentication state
   - Handles wallet association via EIP-712 signature
   - Stores association status in session/local storage

2. **`UnlockWalletModal` component** (`src/components/perp/UnlockWalletModal.tsx`)
   - UI for connecting wallet and signing association message
   - Integrates with RainbowKit for wallet connection
   - Shows error messages and loading states

3. **`OrderForm` component** (updated)
   - Checks authentication before allowing trades
   - Triggers unlock modal when needed

## Setup Instructions

### Step 1: Get Kuma API Credentials

1. Visit [Kuma Exchange Settings](https://exchange.kuma.bid/settings/api)
2. Create a new API key with **Read** scope (minimum required for wallet association)
3. Copy your:
   - API Key (UUID format, e.g., `1f7c4f52-4af7-4e1b-aa94-94fac8d931aa`)
   - API Secret (64-character hex string, e.g., `axuh3ywgg854aq7m73oy6gnnpj5ar9a67szuw5lclbz77zqu0j`)

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Kuma credentials to `.env.local`:
   ```env
   # Kuma API Configuration
   NEXT_PUBLIC_KUMA_API_KEY=your-api-key-here
   NEXT_PUBLIC_KUMA_API_SECRET=your-api-secret-here
   NEXT_PUBLIC_KUMA_SANDBOX=false  # Set to 'true' for testing
   ```

3. **Important**: Never commit `.env.local` to version control!

### Step 3: Install Dependencies

Dependencies are already installed:
- `@kumabid/kuma-sdk@^1.2.0` - Kuma JavaScript SDK
- `uuid` - For generating nonces
- `wagmi` - For Web3 wallet integration
- `@rainbow-me/rainbowkit` - For wallet connection UI

### Step 4: Test the Integration

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/perp` page

3. Click Buy or Sell button

4. Follow the unlock flow:
   - If wallet not connected: Connect via RainbowKit
   - If wallet connected: Sign association message
   - Once signed: Session is stored (optional 30-day persistence)

## How It Works

### Wallet Association API Flow

The `associateWallet` function in `useKumaAuth.ts` performs these steps:

1. **Create Kuma Client**
   ```typescript
   const client = new RestAuthenticatedClient({
     apiKey: process.env.NEXT_PUBLIC_KUMA_API_KEY,
     apiSecret: process.env.NEXT_PUBLIC_KUMA_API_SECRET,
     sandbox: false
   });
   ```

2. **Generate Nonce**
   ```typescript
   const nonce = uuidv1(); // Time-based UUID
   ```

3. **Request EIP-712 Signature**
   - The SDK generates typed data for `WalletAssociation`
   - User signs via their wallet (MetaMask, etc.)
   - Signature format:
     ```typescript
     {
       domain: { name, version, chainId, verifyingContract },
       types: { WalletAssociation: [...] },
       message: { nonce: uint128, wallet: address }
     }
     ```

4. **Submit to Kuma API**
   ```typescript
   POST /v1/wallets
   Headers:
     - KUMA-API-KEY: <your-api-key>
     - KUMA-HMAC-SIGNATURE: <computed-hmac>
   Body:
     {
       parameters: { nonce, wallet },
       signature: <user-signature>
     }
   ```

5. **Store Session**
   - Session storage: Current session only
   - Local storage (optional): 30-day persistence

## API Endpoints Used

### Associate Wallet
- **Endpoint**: `POST /v1/wallets`
- **Security**: Trade (requires API key + HMAC + wallet signature)
- **API Key Scope**: Read
- **Request**:
  ```json
  {
    "parameters": {
      "nonce": "uuid-v1-string",
      "wallet": "0x..."
    },
    "signature": "0x..."
  }
  ```
- **Response**: Returns `KumaWallet` object with balance, positions, etc.

### Future Endpoints (When Implementing Trading)
- `POST /v1/orders` - Create orders
- `GET /v1/wallets` - Get wallet info
- `GET /v1/positions` - Get open positions
- `GET /v1/orders` - Get order history

## Security Considerations

### Environment Variables
- **Never expose API secrets** in client-side code
- Use `NEXT_PUBLIC_*` prefix for client-accessible vars
- Kuma SDK handles HMAC signing automatically

### Signature Security
- User signs a unique nonce (time-based UUID v1)
- Signature is one-time use and cannot be replayed
- EIP-712 typed data ensures message integrity
- Domain separator prevents cross-chain attacks

### Session Management
- Session storage: Cleared when browser tab closes
- Local storage: Persists for 30 days (opt-in)
- Users can manually disconnect by:
  1. Disconnecting wallet via RainbowKit
  2. Clearing browser storage

## Troubleshooting

### "API credentials not configured" Error
- Ensure `.env.local` exists with valid `NEXT_PUBLIC_KUMA_API_KEY` and `NEXT_PUBLIC_KUMA_API_SECRET`
- Restart dev server after adding env vars

### "User rejected signature" Error
- User declined the signature request in their wallet
- This is expected behavior - prompt user to try again

### "Invalid API credentials" Error
- Check that API key/secret are correct
- Verify API key has "Read" scope enabled
- For sandbox testing, set `NEXT_PUBLIC_KUMA_SANDBOX=true`

### CORS Errors
- Kuma API should allow requests from your domain
- Contact Kuma support if you see CORS issues in production

### TypeScript Errors
- Run `npm run build` to check for type errors
- Ensure all imports use correct paths

## Next Steps

### 1. Implement Order Submission
Update `src/hooks/perp/useCreateOrder.ts` to use the authenticated client:

```typescript
import { useKumaAuth } from './useKumaAuth';
import { OrderType, OrderSide } from '@kumabid/kuma-sdk';
import { v1 as uuidv1 } from 'uuid';

export const useCreateOrder = () => {
  const { client, isAssociated } = useKumaAuth();

  const createMarketOrder = async (params) => {
    if (!client || !isAssociated) {
      throw new Error('Wallet not unlocked');
    }

    const order = await client.createOrder({
      nonce: uuidv1(),
      wallet: params.wallet,
      market: params.market,
      type: OrderType.market,
      side: params.side === 'buy' ? OrderSide.buy : OrderSide.sell,
      quantity: params.quantity,
      reduceOnly: params.reduceOnly || false,
    });

    return order;
  };

  return { createMarketOrder };
};
```

### 2. Fetch Real Account Balance
Update `src/hooks/perp/useAccountBalance.ts`:

```typescript
const fetchBalance = async () => {
  if (!client || !walletAddress) return;

  const wallets = await client.getWallets({ wallet: walletAddress });
  if (wallets.length > 0) {
    const wallet = wallets[0];
    setAccountBalance({
      balance: parseFloat(wallet.totalValue),
      freeCollateral: parseFloat(wallet.availableOrderMargin),
      // ... map other fields
    });
  }
};
```

### 3. Real-time Position Updates
Use Kuma WebSocket API for live position updates:

```typescript
import { WebSocketClient } from '@kumabid/kuma-sdk/clients';

const wsClient = new WebSocketClient({ sandbox: false });
await wsClient.connect();

// Subscribe to positions
wsClient.subscribe({
  name: 'positions',
  wallet: address,
}, (data) => {
  console.log('Position update:', data);
});
```

### 4. Add Market Pair Switching
Currently hardcoded to `BTC-USD`. To add more pairs:
1. Update `perpStore.ts` to store selected market
2. Fetch available markets from `client.public.getMarkets()`
3. Add market selector UI component

## Resources

- [Kuma API Documentation](https://api-docs-v1.kuma.bid)
- [Kuma SDK Documentation](https://sdk-js-docs-v1.kuma.bid)
- [Kuma Exchange](https://exchange.kuma.bid)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)

## Support

For issues with:
- **Kuma API/SDK**: Contact Kuma support or check their Discord
- **Integration code**: Review this documentation or check GitHub issues
- **Wallet connection**: See RainbowKit documentation
