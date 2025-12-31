"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  phantomWallet,
  metaMaskWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";

// Katana chain - for spot trading, lending, vaults
export const katana = {
  id: 747474,
  name: "Katana",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.katana.network/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Katana Explorer",
      url: "https://explorer.katanarpc.com",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 1,
    },
  },
} as const;

// XCHAIN - for perpetual trading only (perp page)
// Note: MetaMask requires nativeCurrency.decimals to be 18 for wallet_addEthereumChain
// Even though XCHAIN uses USDC with 6 decimals, we must specify 18 for MetaMask compatibility
export const xchain = {
  id: 94524,
  name: "XCHAIN",
  nativeCurrency: {
    decimals: 18, // Required by MetaMask for EVM chains
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: ["https://xchain-rpc.kuma.bid/"],
    },
  },
  blockExplorers: {
    default: {
      name: "XCHAIN Explorer",
      url: "https://xchain-explorer.kuma.bid",
    },
  },
} as const;
// Custom mobile phantom wallet connector
const customPhantomWallet = () => ({
  ...phantomWallet(),
  mobile: {
    getUri: () => {
      // Custom mobile deep link for Phantom
      return "https://phantom.app/ul/v1/connect";
    },
  },
});

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        coinbaseWallet,
        // Use custom phantom wallet for better mobile support
        customPhantomWallet,
      ],
    },
    {
      groupName: "Other",
      wallets: [walletConnectWallet, injectedWallet],
    },
  ],
  {
    appName: "AggTrade",
    projectId: "65240d1c40e75dcaf77200d1ec616a45",
  }
);

export const config = createConfig({
  connectors,
  // Support both Katana (spot/lending) and XCHAIN (perp trading)
  chains: [katana, xchain],
  transports: {
    [katana.id]: http(),
    [xchain.id]: http(),
  },
  ssr: false, // Disabled for injected provider compatibility
});

const queryClient = new QueryClient();

const WagmiWalletProvider = ({ children }: any) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00F5E0",
            accentColorForeground: "#000",
            borderRadius: "small",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WagmiWalletProvider;
