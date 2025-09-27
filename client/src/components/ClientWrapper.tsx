"use client";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sepolia } from "viem/chains";
import { DynamicContextProvider, DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

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
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

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

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[90vw] md:max-w-5xl px-4 md:px-6 py-3 flex justify-between items-center bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <Link href="/" className="flex items-center gap-2 md:gap-3 group">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 text-xl md:text-2xl font-bold tracking-wider group-hover:from-gray-700 group-hover:to-gray-500 transition-all duration-300">
          PLAY
        </span>
      </Link>

      <div className="flex items-center gap-3">
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
                    {userData.username || userData.display_name}
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