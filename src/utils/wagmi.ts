// src/utils/wagmiEthers.ts
import { providers } from "ethers";
import { PublicClient, WalletClient } from "viem";

export function viemPublicClientToEthersProvider(publicClient?: PublicClient) {
  if (!publicClient) return;
  const { transport, chain } = publicClient;
  const network = {
    name: chain!.name,
    chainId: chain!.id,
    ensAddress: chain!.contracts?.ensRegistry?.address,
  };
  if ("transports" in transport) {
    // fallback transport
    return new providers.FallbackProvider(
      transport.transports.map(
        (t: any) => new providers.JsonRpcProvider(t.value?.url, network)
      )
    );
  }
  return new providers.JsonRpcProvider((transport as any).url, network);
}

export function viemWalletClientToEthersSigner(walletClient?: WalletClient) {
  if (!walletClient) return;
  const { transport, chain, account } = walletClient;
  const network = {
    name: chain!.name,
    chainId: chain!.id,
    ensAddress: chain!.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport as any, network);
  return provider.getSigner(account!.address);
}
