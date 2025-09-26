"use client";
import { ReactNode, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { DynamicContextProvider, DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const config = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

// Component to handle wallet connection redirect logic
const WalletRedirectHandler = ({ children }: { children: ReactNode }) => {
  const { primaryWallet, user } = useDynamicContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if wallet is connected and user is not already on dashboard
    if (primaryWallet && user && pathname === '/') {
      router.push('/dashboard');
    }
  }, [primaryWallet, user, pathname, router]);

  return <>{children}</>;
};

const NavContent = () => {

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90vw] md:max-w-5xl px-4 md:px-6 py-3 flex justify-between items-center bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <Link href="/" className="flex items-center gap-2 md:gap-3 group">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 text-xl md:text-2xl font-bold tracking-wider group-hover:from-gray-700 group-hover:to-gray-500 transition-all duration-300">
          PLAY
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="relative bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <DynamicWidget />
          </div>
        </div>
      </div>
    </nav>
  );
};

const ClientWrapper = ({ children }: { children: ReactNode }) => {

  return (
    <DynamicContextProvider
      settings={{
        environmentId: "43e07da2-5c5b-4c63-9cb3-98eb2f28f9a7",
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <WalletRedirectHandler>
        <div className="relative min-h-screen  bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <NavContent />
          <main className="pt-16" style={{ backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}>{children}</main>
        </div>
      </WalletRedirectHandler>
    </DynamicContextProvider>

  );
};

export default ClientWrapper;