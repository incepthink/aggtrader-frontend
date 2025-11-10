# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AggTrade is a Next.js 15-based DeFi aggregation platform exclusively focused on the Katana network (chainId: 747474), providing spot trading, lending/borrowing (via Morpho and Aave), and yield farming (via Yearn vaults).

**IMPORTANT: This application ONLY supports Katana network. All multi-chain functionality has been removed.**

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

Development server runs on http://localhost:3000

## Core Technology Stack

- **Next.js 15.5.2** with App Router (file-based routing)
- **React 19** with Server Components pattern
- **TypeScript 5** with strict mode
- **Tailwind CSS 4** (CSS-based configuration, no tailwind.config.js)
- **Material UI 7** + Emotion for component library
- **Wagmi 2.15.6 + Viem 2.31.3** for Web3 interactions
- **RainbowKit 2.2.7** for wallet connection
- **Zustand 5** for global state management
- **TanStack Query 5** for server state/caching

## Architecture Patterns

### Katana-Only Architecture (CRITICAL)

**The app has been simplified to ONLY support Katana (chainId: 747474).**

Key architectural components:

1. **ChainContext** (src/context/ChainContext.tsx):
   - Always returns chainId: 747474
   - No chain switching functionality
   - Provides `isChainMismatch` to detect when wallet is on wrong chain
   - `useChain()` hook always returns Katana configuration

2. **WagmiWalletProvider** (src/components/providers/WagmiWalletProvider.tsx):
   - Configured with ONLY Katana chain
   - Multicall3 contract at `0xcA11bde05977b3631167028862bE2a173976CA11`
   - RPC URL: https://rpc.katana.network/
   - Block explorer: https://explorer.katanarpc.com

3. **spotStore** (src/store/spotStore.ts):
   - Hardcoded to Katana: `chainId: 747474`
   - No chain selection logic
   - Token lists are Katana-only

4. **Token Lists**:
   - Main tokens in `src/utils/katanaTokens.ts` (comprehensive mapping)
   - Minimal list in `src/utils/spot/TokenList.ts` (backwards compatibility)
   - Native ETH address: `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`

**Pattern for using chain context:**
```typescript
import { useChain } from '@/context/ChainContext'

const { chainId, isChainMismatch, isWalletConnected } = useChain()
// chainId is always 747474
// Check isChainMismatch before transactions to ensure wallet is on Katana
```

### State Management Strategy

**Zustand Stores** (src/store/):
- `spotStore.ts` - Token selection for spot trading (tokenOne, tokenTwo, chartToken)
- `aaveStore.ts` - Aave lending protocol state
- `store.ts` - User wallet address and provider

**React Context**:
- `ChainContext` - Katana-only chain management (use `useChain()` hook)
- `TokenSelectModalContext` - Token selection modal state
- `DerivedStateTwapProvider` - TWAP limit order state

**TanStack Query**:
- Used for all server state (prices, market data, balances)
- Query keys pattern: `['feature', chainId, address]`
- Typical config: `staleTime: 60000, gcTime: 300000`
- Always invalidate balance queries after transactions: `queryClient.invalidateQueries({ queryKey: ['balance'] })`

### Web3 Integration

**Provider Hierarchy** (src/app/layout.tsx):
```
WagmiWalletProvider (Wagmi config + RainbowKit)
  └→ MuiThemeProvider
    └→ ChainProvider (Katana only)
      └→ DerivedStateTwapProvider (Limit orders)
        └→ VaultProviders (Yearn)
          └→ App components
```

**Viem ↔ Ethers Bridge** (src/utils/wagmi.ts):
Some integrations (Aave) require ethers.js v5. Use adapters:
- `viemPublicClientToEthersProvider()` - For read operations
- `viemWalletClientToEthersSigner()` - For write operations

**Transaction Pattern**:
```typescript
// 1. Check/request token approval
const { writeContract } = useWriteContract()

// 2. Execute transaction
writeContract({ address, abi, functionName, args })

// 3. Wait for confirmation
const { data: hash } = useWaitForTransactionReceipt()

// 4. Invalidate queries to refresh UI
queryClient.invalidateQueries({ queryKey: ['balance'] })
```

### Component Organization

Feature-based structure:
```
src/app/[feature]/page.tsx           → Page component (App Router)
src/components/[feature]/            → Feature UI components
src/hooks/[feature]/                 → Feature data hooks
src/store/[feature]Store.ts          → Feature state (if needed)
```

Most components are `"use client"` due to Web3 hooks (wagmi/viem require client-side execution).

## Key DeFi Integrations

### Morpho Blue (Primary Lending)
- Components: `src/components/lend-morpho/`
- Hooks: `src/hooks/lend-morpho/`
- Features: Lend/borrow markets, MetaMorpho vaults
- SDK: `@morpho-org/blue-sdk`, `@morpho-org/morpho-ts`

Key hooks:
- `useMarketsQuery()` - Available lending markets
- `useVaultsQuery()` - MetaMorpho vault strategies
- `useMorphoDeposit()`, `useMorphoWithdraw()` - Supply/withdraw
- `useMorphoBorrow()`, `useMorphoRepay()` - Borrow/repay

All Morpho queries automatically filter by Katana chainId (747474).

### Aave V3 (Secondary Lending)
- Service: `src/services/lending/aaveService.ts`
- Store: `src/store/aaveStore.ts`
- Components: `src/components/lending/`
- Uses service layer pattern with Zustand store
- Requires ethers v5 adapter (use `viemPublicClientToEthersProvider()`)

### SushiSwap (DEX)
- Components: `src/components/spot/classic-swap/`
- Hooks: `src/hooks/sushiswap/`
- Features: Classic swap, price discovery, pool analytics

Key hooks:
- `useSushiClassic()` - Execute swaps (hardcoded to ChainId.KATANA)
- `usePrices()` - Token prices
- `useTokenApproval()` - ERC20 approvals
- `useKatanaPools()` - Liquidity pool data

### Orbs TWAP (Limit Orders)
- Integration: `src/lib/swap/twap/`
- Components: `src/components/spot/limit-widget/`
- Features: Time-weighted average price orders with 0.25% fee
- Provider: `DerivedStateTwapProvider` for order state management

### Yearn Finance (Yield Vaults)
- Integration: `src/lib/yearnfi/`
- Components: `src/components/yearnfi/`
- Hooks: `src/hooks/vaults-v2/`
- Provider: `VaultProviders` wraps vault functionality

## Project Structure

```
src/
├── app/                              # Next.js App Router pages
│   ├── spot/swap/                    # Spot trading
│   ├── spot/pools/                   # Liquidity pools
│   ├── earn/lend/                    # Morpho supply markets
│   ├── earn/borrow/                  # Morpho borrow markets
│   ├── earn/vault/                   # MetaMorpho vaults
│   ├── profile/                      # User portfolio
│   └── referrals/                    # Referral system
│
├── components/
│   ├── common/                       # Shared UI components
│   ├── spot/                         # Spot trading components
│   │   ├── classic-swap/             # SushiSwap integration
│   │   ├── limit-widget/             # TWAP limit orders
│   │   └── chart/                    # Price charts
│   ├── lend-morpho/                  # Morpho protocol components
│   ├── lending/                      # Aave components
│   └── providers/                    # Context providers
│
├── hooks/                            # Custom React hooks
│   ├── sushiswap/                    # SushiSwap-specific hooks
│   ├── lend-morpho/                  # Morpho hooks
│   └── vaults-v2/                    # Yearn vault hooks
│
├── store/                            # Zustand stores
├── context/                          # React Contexts
├── lib/                              # External SDK integrations
├── services/                         # Business logic layer
├── utils/                            # Utility functions
└── types/                            # TypeScript types
```

## Common Development Workflows

### Adding a New Token (Katana Only)

Update `src/utils/katanaTokens.ts`:
```typescript
"0xTokenAddress": {
  symbol: "SYMBOL",
  decimals: 18,
  logoUrl: "https://assets.katana.network/icons/token.svg",
  name: "Token Name",
  address: "0xTokenAddress"
}
```

For swap UI, also update `src/utils/spot/TokenList.ts` if needed.

### Adding a New Page

1. Create `src/app/[route]/page.tsx`
2. Add corresponding components in `src/components/[route]/`
3. Update navbar in `src/components/common/navbar/Navbar.tsx`

### Working with Charts

Chart libraries:
- **Lightweight Charts** - OHLC candlestick charts
- **Recharts** - Portfolio/analytics charts

Chart data hooks in `src/hooks/sushiswap/katanaChart/` - Katana DEX data

## Environment Variables

Required in `.env`:
- `NEXT_PUBLIC_ALCHEMY_API` - Blockchain data provider
- `NEXT_PUBLIC_ZERION_API_KEY` - Portfolio data
- `NEXT_PUBLIC_MORALIS_API_KEY` - Wallet analytics
- `NEXT_PUBLIC_COVALENT_KEY` - Chain data
- `NEXT_PUBLIC_ETHERSCAN_API` - Transaction explorer

## Important Quirks & Gotchas

1. **Katana-Only Architecture**: The app ONLY supports Katana (chainId: 747474). Always check `isChainMismatch` from `useChain()` before transactions.

2. **Ethers v5 Required**: Some SDKs (Aave) require ethers v5. Use the Viem→Ethers adapters in `src/utils/wagmi.ts`.

3. **Tailwind v4**: Uses new CSS-based configuration. No `tailwind.config.js` file - theme variables in `src/app/globals.css`.

4. **Client Components**: Most components require `"use client"` directive due to Web3 hooks.

5. **Token Address Normalization**:
   - Native ETH: `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`
   - Wrapped ETH: `0xEE7D8BCFb72bC1880D0Cf19822eB0A2e6577aB62`

6. **Token Selection**: Three separate states - spot swap (tokenOne, tokenTwo), chart display (chartToken), limit orders (TWAP state)

7. **Query Invalidation**: Always invalidate balance queries after successful transactions:
   ```typescript
   queryClient.invalidateQueries({ queryKey: ['balance'] })
   ```

8. **No Test Infrastructure**: Currently no testing setup. Tests should be added before modifying critical paths.

## Design System

**Color Palette:**
- Primary: `#00F5E0` (cyan/teal)
- Background: `#050C19` (dark blue)
- Glassmorphism with backdrop blur

**Component Pattern:**
```tsx
<GlowBox>                             // Glassmorphic wrapper
  <Container maxWidth="xl">           // MUI responsive container
    <Stack spacing={2}>               // MUI flexbox with gaps
      {/* Content */}
    </Stack>
  </Container>
</GlowBox>
```

## Performance Patterns

- **React Query caching**: Aggressive caching (5-30min staleTime)
- **Zustand persistence**: State persisted to localStorage
- **Multicall3**: Address `0xcA11bde05977b3631167028862bE2a173976CA11` for batched reads
- **Next.js Image**: Use `next/image` for optimized images
- **Code splitting**: Automatic via Next.js App Router

## Critical Files

Must-read files for understanding the codebase:
1. `src/app/layout.tsx` - Provider hierarchy
2. `src/context/ChainContext.tsx` - Katana-only chain logic
3. `src/components/providers/WagmiWalletProvider.tsx` - Web3 configuration
4. `src/store/spotStore.ts` - Spot trading state
5. `src/utils/wagmi.ts` - Viem/Ethers bridge
6. `src/utils/katanaTokens.ts` - Katana token mapping
7. `src/hooks/sushiswap/useSushiClassic.ts` - Swap logic