'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/retroui/Button';
import toast from 'react-hot-toast';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useUser } from '@/components/ClientWrapper';

const CreateENSPage = () => {
  const [ensName, setEnsName] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const { primaryWallet, user } = useDynamicContext();
  const { userData, setUserData } = useUser();

  // Check if wallet is connected
  const isConnected = !!primaryWallet;
  const walletAddress = primaryWallet?.address || '';
  const email = user?.email || `user${Math.random().toString(36).substring(2, 8)}@example.com`;
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : `Player${Math.floor(Math.random() * 1000)}`;

  // Redirect if user already exists
  useEffect(() => {
    if (userData && primaryWallet) {
      toast.success('You already have an ENS name! Redirecting to dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    }
  }, [userData, primaryWallet]);

  const handleEnsNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove .chess.eth if user types it
    if (value.endsWith('.chess.eth')) {
      value = value.replace('.chess.eth', '');
    }
    setEnsName(value);
  };

  const handleMint = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!ensName.trim()) {
      toast.error('Please enter a name for your ENS');
      return;
    }

    setIsMinting(true);

    try {
      const fullEnsName = `${ensName.toLowerCase()}.chess.eth`;
      
      const newUserData = {
        username: fullEnsName,
        email: email,
        display_name: displayName,
        wallet_address: walletAddress,
        ens_name: fullEnsName,
        ens_namehash: `0x${Math.random().toString(16).substring(2, 66)}`, // Mock namehash
        ens_resolver: `0x${Math.random().toString(16).substring(2, 42)}`, // Mock resolver
        ens_registered: true,
        ens_verified: true,
      };

      const response = await fetch('http://localhost:8000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully minted ${fullEnsName}!`);
        setUserData(result.data); // Update user data in context
        setEnsName('');
        
        // Redirect to dashboard after successful mint
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        toast.error(result.message || 'Failed to mint ENS');
      }
    } catch (error) {
      console.error('Error minting ENS:', error);
      toast.error('Failed to mint ENS. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
          <h1 className="text-3xl font-head font-bold text-gray-900">Chess.eth</h1>
        </div>
        <p className="text-gray-600 text-lg">Connect with Chess builders</p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md">
        {/* Search Input */}
        <div className="relative mb-8">
          <div className="relative">
            <input
              type="text"
              value={ensName}
              onChange={handleEnsNameChange}
              placeholder="SEARCH FOR A NAME"
              className="w-full px-6 py-4 text-lg border-2 border-blue-500 rounded-lg focus:border-blue-600 focus:outline-none transition-colors duration-200 font-sans bg-white"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          {/* ENS Name Display Below Input */}
          {ensName && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-lg font-medium text-gray-800">
                  {ensName.toLowerCase()}
                  <span className="text-blue-500">.chess.eth</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wallet Connection Status */}
        {!isConnected ? (
          <div className="text-center mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-800 font-medium mb-2">Wallet Not Connected</div>
              <div className="text-sm text-yellow-700">
                Please connect your wallet using the button in the top navigation to continue.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-3 font-medium">Connected Wallet:</div>
            <div className="space-y-2">
              <div className="font-mono text-sm text-gray-800 break-all bg-white px-3 py-2 rounded border">
                {walletAddress}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {email}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Display Name:</span> {displayName}
              </div>
            </div>
          </div>
        )}

        {/* Mint Button */}
        <Button
          onClick={handleMint}
          disabled={!isConnected || !ensName.trim() || isMinting}
          size="lg"
          className="w-full"
        >
          {isMinting ? 'Minting...' : 'Mint ENS'}
        </Button>

      </div>

      {/* Floating Profile Elements (Decorative) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-16 h-16 bg-yellow-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-12 h-12 bg-green-200 rounded-full opacity-60 animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-20 w-14 h-14 bg-purple-200 rounded-full opacity-60 animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-10 w-10 h-10 bg-pink-200 rounded-full opacity-60 animate-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default CreateENSPage;
