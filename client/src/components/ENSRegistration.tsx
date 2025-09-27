'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ENSRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  displayName: string;
  walletAddress: string;
}

const ENSRegistration = ({ 
  isOpen, 
  onClose, 
  userEmail, 
  displayName, 
  walletAddress 
}: ENSRegistrationProps) => {
  const [ensName, setEnsName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMint = async () => {
    if (!ensName.trim()) return;

    setIsLoading(true);
    
    try {
      // TODO: Replace with actual ENS minting logic
      console.log('Minting ENS with details:', {
        username: ensName.toLowerCase(),
        email: userEmail,
        display_name: displayName,
        wallet_address: walletAddress,
        ens_name: `${ensName.toLowerCase()}.play.eth`,
        ens_registered: true,
        ens_verified: false, // Will be verified after minting
      });

      // Create user in backend
      const response = await fetch('http://localhost:8000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: ensName.toLowerCase(),
          email: userEmail,
          display_name: displayName,
          wallet_address: walletAddress,
          ens_name: `${ensName.toLowerCase()}.play.eth`,
          ens_registered: true,
          ens_verified: false,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('User created successfully:', data.data);
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        console.error('Failed to create user:', data.message);
      }
    } catch (error) {
      console.error('ENS registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mintENSName = async (ensName: string) => {
    // TODO: Placeholder for smart contract integration
    console.log('🚀 Minting ENS name:', `${ensName}.play.eth`);
    console.log('📝 Wallet Address:', walletAddress);
    console.log('⏳ This will integrate with smart contract...');
    
    // Simulate minting process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      transactionHash: '0x1234567890abcdef', // Mock hash
      ensName: `${ensName}.play.eth`
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <span className="text-2xl text-blue-300">◊</span>
              </div>
              <h2 className="text-2xl font-light text-white mb-2 tracking-wide">
                Claim Your Identity
              </h2>
              <p className="text-slate-400 font-light text-sm leading-relaxed">
                Choose a unique name for your gaming profile
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-slate-300 text-sm font-light mb-2">
                  Choose your gaming handle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ensName}
                    onChange={(e) => setEnsName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    placeholder="username"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white font-mono focus:border-blue-500/50 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    .play.eth
                  </span>
                </div>
                {ensName && (
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {ensName.toLowerCase()}.play.eth
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMint}
                  disabled={!ensName.trim() || isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-light transition-all duration-200"
                >
                  {isLoading ? 'Minting...' : 'Mint Identity'}
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">Your Details:</p>
                <p>Email: {userEmail}</p>
                <p>Name: {displayName}</p>
                <p>Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ENSRegistration;