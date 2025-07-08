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
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";

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

const config = createConfig({
  connectors,
  chains: [mainnet, polygon, optimism, arbitrum, base],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
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
