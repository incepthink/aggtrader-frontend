export const KATANA_PERPS_SANDBOX =
  process.env.NEXT_PUBLIC_KATANA_PERPS_SANDBOX === "true";

// Exchange smart contract addresses from api-docs-v1-perps.katana.network
export const KATANA_PERPS_EXCHANGE_ADDRESS = (KATANA_PERPS_SANDBOX
  ? "0x92d3072dDe1aD3e9B7895500F504aA5e664E71d3"
  : "0x835Ba5b1B202773A94Daaa07168b26B22584637a") as `0x${string}`;

// vbUSDC on Katana mainnet — see src/utils/katanaTokens.ts
export const VB_USDC_ADDRESS =
  "0x203A662b0BD271A6ed5a60EdFbd04bFce608FD36" as `0x${string}`;
export const VB_USDC_DECIMALS = 6;
export const VB_USDC_SYMBOL = "vbUSDC";

export const KATANA_CHAIN_ID = 747474;

// Minimal fragment of Exchange_v1 ABI — full ABI lives in
// @katanaperps/katana-perps-sdk/dist/abis/Exchange_v1.json
export const KATANA_PERPS_EXCHANGE_DEPOSIT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "quantityInAssetUnits",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "depositorWallet",
        type: "address",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
