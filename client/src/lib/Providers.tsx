'use client';

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const evmNetworks = [
  {
    blockExplorerUrls: ['https://testnet.rsk.co/'],
    chainId: 31,
    chainName: 'Rootstock Testnet',
    name: 'Rootstock',
    iconUrls: ['https://placehold.co/500x500'],
    nativeCurrency: {
      decimals: 18,
      name: 'Rootstock Testnet',
      symbol: 'tRBTC',
      iconUrl: 'https://placehold.co/500x500',
    },
    networkId: 31,
    rpcUrls: ['https://rootstock-testnet.drpc.org', 'wss://rootstock-testnet.drpc.org'],
    vanityName: 'Rootstock Testnet',
  },
  {
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
    chainId: 11155111,
    chainName: 'Sepolia',
    name: 'Sepolia',
    iconUrls: ['https://app.dynamic.xyz/assets/networks/eth.svg'],
    nativeCurrency: {
      decimals: 18,
      name: 'Sepolia Ether',
      symbol: 'ETH',
      iconUrl: 'https://app.dynamic.xyz/assets/networks/eth.svg',
    },
    networkId: 11155111,
    rpcUrls: ['https://sepolia.infura.io/v3/', 'https://sepolia.rpc.sepolia.org'],
    vanityName: 'Sepolia Testnet',
  },
];

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "43e07da2-5c5b-4c63-9cb3-98eb2f28f9a7",
        walletConnectors: [EthereumWalletConnectors],
        overrides: { evmNetworks },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}