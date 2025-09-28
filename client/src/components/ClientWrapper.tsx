"use client";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { defineChain } from 'viem';
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { API_BASE } from "@/lib/config";
import { Toaster } from "react-hot-toast";

// User context to share user data across components
interface UserContextType {
  userData: any;
  setUserData: (data: any) => void;
  isCheckingUser: boolean;
  setIsCheckingUser: (checking: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    // During SSR/SSG, return safe defaults instead of throwing
    if (typeof window === 'undefined') {
      return {
        userData: null,
        setUserData: () => {},
        isCheckingUser: false,
        setIsCheckingUser: () => {}
      };
    }
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Define Rootstock Mainnet chain
const rootstock = defineChain({
  id: 30,
  name: 'Rootstock Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Rootstock Bitcoin',
    symbol: 'RBTC',
  },
  rpcUrls: {
    default: {
      http: ['https://public-node.rsk.co'],
    },
    public: {
      http: ['https://public-node.rsk.co'],
    },
  },
  blockExplorers: {
    default: { name: 'RSK Explorer', url: 'https://explorer.rsk.co' },
  },
});

// Define Rootstock Testnet chain
const rootstockTestnet = defineChain({
  id: 31,
  name: 'Rootstock Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Test Rootstock Bitcoin',
    symbol: 'tRBTC',
  },
  rpcUrls: {
    default: {
      http: ['https://public-node.testnet.rsk.co'],
    },
    public: {
      http: ['https://public-node.testnet.rsk.co'],
    },
  },
  blockExplorers: {
    default: { name: 'RSK Testnet Explorer', url: 'https://explorer.testnet.rsk.co' },
  },
});

const config = createConfig({
  chains: [rootstock, rootstockTestnet, sepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [rootstock.id]: http(),
    [rootstockTestnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

// Component to handle wallet connection redirect logic
const WalletRedirectHandler = ({ children }: { children: ReactNode }) => {
  const { primaryWallet, user } = useDynamicContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Function to check if user exists in database
  const checkUserExists = async (walletAddress: string) => {
    try {
      setIsCheckingUser(true);
      const response = await fetch(`http://localhost:8000/api/users/wallet/${walletAddress}`);
      const result = await response.json();
      
      if (result.success) {
        setUserData(result.data);
        return true;
      } else {
        setUserData(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUserData(null);
      return false;
    } finally {
      setIsCheckingUser(false);
    }
  };

  useEffect(() => {
    const handleWalletConnection = async () => {
      if (primaryWallet && user && pathname === '/') {
        const walletAddress = primaryWallet.address;
        const exists = await checkUserExists(walletAddress);
        
        if (exists) {
          // User exists, redirect to dashboard
          router.push('/dashboard');
        } else {
          // User doesn't exist, redirect to ENS creation
          router.push('/create/ens');
        }
      }
    };

    handleWalletConnection();
  }, [primaryWallet, user, pathname, router]);

  return (
    <UserContext.Provider value={{ userData, setUserData, isCheckingUser, setIsCheckingUser }}>
      {children}
    </UserContext.Provider>
  );
};

const NavContent = () => {
  const { userData, isCheckingUser } = useUser();
  const { primaryWallet } = useDynamicContext();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render until we're on the client
  if (!isClient) {
    return (
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90vw] md:max-w-5xl px-4 md:px-6 py-3 flex justify-between items-center bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <Link href="/" className="flex items-center gap-2 md:gap-3 group">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 text-xl md:text-2xl font-bold tracking-wider group-hover:from-gray-700 group-hover:to-gray-500 transition-all duration-300">
            PLAY
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90vw] md:max-w-5xl px-4 md:px-6 py-3 flex justify-between items-center bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <Link href="/" className="flex items-center gap-2 md:gap-3 group">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 text-xl md:text-2xl font-bold tracking-wider group-hover:from-gray-700 group-hover:to-gray-500 transition-all duration-300">
          PLAY
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Navigation Links */}
        {primaryWallet && userData && (
          <div className="hidden md:flex items-center gap-2">
            <Link 
              href="/dashboard" 
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/contests" 
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Contests
            </Link>
            <Link 
              href="/dashboard/chess" 
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Chess
            </Link>
          </div>
        )}

        {/* Show loading state */}
        {primaryWallet && isCheckingUser && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Checking...</span>
          </div>
        )}

        <div className="relative group">
          <div className="relative bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <DynamicWidget />
            {/* Custom username overlay when user exists */}
            {primaryWallet && userData && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-md shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800">
                    {userData.username}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const ClientWrapper = ({ children }: { children: ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR, render without Dynamic context
  if (!isClient) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90vw] md:max-w-5xl px-4 md:px-6 py-3 flex justify-between items-center bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 text-xl md:text-2xl font-bold tracking-wider group-hover:from-gray-700 group-hover:to-gray-500 transition-all duration-300">
              PLAY
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        </nav>
        <main style={{ backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
          <WalletRedirectHandler>

            <Toaster position="top-center" />
            <div className="relative min-h-screen  bg-gradient-to-br from-gray-50 via-white to-gray-100">
              <NavContent />
              <main style={{ backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}>{children}</main>
            </div>
          </WalletRedirectHandler>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default ClientWrapper;