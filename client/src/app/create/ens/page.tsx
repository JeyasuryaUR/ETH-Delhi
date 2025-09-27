'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/retroui/Button';
import toast from 'react-hot-toast';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useUser } from '@/components/ClientWrapper';
import { API_BASE } from '@/lib/config';

const CreateENSPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [ensName, setEnsName] = useState('');
  const [chessComId, setChessComId] = useState('');
  const [fideId, setFideId] = useState('');
  const [lichessId, setLichessId] = useState('');
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

  const handleNextStep = () => {
    if (!ensName.trim()) {
      toast.error('Please enter a name for your ENS');
      return;
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
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
        chess_com_id: chessComId || null,
        fide_id: fideId || null,
        lichess_id: lichessId || null,
      };

      const response = await fetch(API_BASE + '/users', {
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
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <div className="relative z-10 px-8 pt-16 pb-8">
          <div className="text-center mb-8">
            <div className="inline-block mb-6">
              <div className="bg-secondary text-secondary-foreground px-4 py-2 retro-border retro-shadow font-retro text-xs uppercase tracking-wider">
                ENS Registration
              </div>
            </div>
            <h1 className="text-2xl font-black font-heading mb-4 text-foreground leading-tight">
              <span className="block font-retro text-lg mb-2 text-primary">CREATE</span>
              YOUR IDENTITY
            </h1>
          </div>
        </div>
        
        <div className="relative z-10 flex-1 px-8 pb-8">
          <div className="max-w-md mx-auto">
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="bg-card retro-border retro-shadow p-4 inline-block">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-10 h-10 retro-border text-sm font-bold font-retro ${
                    currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    1
                  </div>
                  <div className={`w-16 h-2 retro-border ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className={`flex items-center justify-center w-10 h-10 retro-border text-sm font-bold font-retro ${
                    currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content - Mobile */}
            <div className="bg-card retro-border retro-shadow p-4">
              {currentStep === 1 ? (
                /* Step 1: ENS Name - Mobile */
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-black font-heading text-foreground mb-1 uppercase">Step 1: Choose Your Name</h2>
                    <p className="text-muted-foreground font-retro text-xs">Enter your desired ENS name</p>
                  </div>

                  <div className="relative mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={ensName}
                        onChange={handleEnsNameChange}
                        placeholder="SEARCH FOR A NAME"
                        className="w-full px-3 py-2 text-sm retro-border focus:outline-none transition-all duration-200 font-retro bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    
                    {ensName && (
                      <div className="mt-3 text-center">
                        <div className="inline-flex items-center px-2 py-1 bg-primary text-primary-foreground retro-border font-retro text-xs">
                          {ensName.toLowerCase()}
                          <span className="text-primary-foreground/70">.chess.eth</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isConnected ? (
                    <div className="text-center mb-4">
                      <div className="bg-destructive/10 retro-border retro-shadow p-3">
                        <div className="text-destructive font-bold font-retro text-xs mb-1 uppercase">Wallet Not Connected</div>
                        <div className="text-xs text-destructive/80">
                          Please connect your wallet to continue.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted retro-border retro-shadow p-2 mb-4">
                      <div className="text-xs text-muted-foreground mb-1 font-bold font-retro uppercase">Connected:</div>
                      <div className="font-mono text-xs text-foreground break-all">
                        {walletAddress.slice(0, 20)}...
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleNextStep}
                    disabled={!isConnected || !ensName.trim()}
                    size="lg"
                    className="w-full text-sm px-4 py-3 font-bold uppercase tracking-wider font-retro"
                  >
                    Next
                  </Button>
                </>
              ) : (
                /* Step 2: Chess IDs - Mobile */
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-black font-heading text-foreground mb-1 uppercase">Step 2: Chess Profile</h2>
                    <p className="text-muted-foreground font-retro text-xs">Add your chess platform IDs (optional)</p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-xs font-bold font-retro text-foreground mb-1 uppercase">
                        Chess.com Username
                      </label>
                      <input
                        type="text"
                        value={chessComId}
                        onChange={(e) => setChessComId(e.target.value)}
                        placeholder="Enter your Chess.com username"
                        className="w-full px-3 py-2 text-sm retro-border focus:outline-none transition-all duration-200 font-retro bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-retro text-foreground mb-1 uppercase">
                        FIDE ID
                      </label>
                      <input
                        type="text"
                        value={fideId}
                        onChange={(e) => setFideId(e.target.value)}
                        placeholder="Enter your FIDE ID"
                        className="w-full px-3 py-2 text-sm retro-border focus:outline-none transition-all duration-200 font-retro bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-retro text-foreground mb-1 uppercase">
                        Lichess Username
                      </label>
                      <input
                        type="text"
                        value={lichessId}
                        onChange={(e) => setLichessId(e.target.value)}
                        placeholder="Enter your Lichess username"
                        className="w-full px-3 py-2 text-sm retro-border focus:outline-none transition-all duration-200 font-retro bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="bg-primary retro-border retro-shadow p-3 mb-4">
                    <div className="text-xs text-primary-foreground mb-1 font-bold font-retro uppercase">Your ENS Name:</div>
                    <div className="text-sm font-bold font-retro text-primary-foreground">
                      {ensName.toLowerCase()}
                      <span className="text-primary-foreground/70">.chess.eth</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handlePrevStep}
                      variant="secondary"
                      size="lg"
                      className="flex-1 text-sm px-3 py-2 font-bold uppercase tracking-wider font-retro"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleMint}
                      disabled={!isConnected || isMinting}
                      size="lg"
                      className="flex-1 text-sm px-3 py-2 font-bold uppercase tracking-wider font-retro"
                    >
                      {isMinting ? 'Minting...' : 'Mint ENS'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen pt-8">
        {/* Left Section - Title and Branding */}
        <div className="relative z-10 flex-1 flex flex-col items-end text-center justify-center px-8 lg:px-12 xl:px-16">
          <div className="max-w-2xl">
            <div className="inline-block mb-4">
              <div className="bg-secondary text-secondary-foreground px-4 py-2 retro-border retro-shadow font-retro text-sm uppercase tracking-wider">
                ENS Registration
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black font-heading mb-4 text-foreground leading-tight">
              <span className="block font-retro text-lg lg:text-xl xl:text-2xl mb-3 text-primary">CREATE</span>
              YOUR IDENTITY
            </h1>


            <div className="grid grid-cols-2 gap-3 max-w-md">
              <div className="bg-card retro-border retro-shadow retro-shadow-hover p-3 text-center">
                <div className="text-lg font-black font-retro text-primary mb-1">ENS</div>
                <div className="text-xs font-bold uppercase tracking-wider text-card-foreground">
                  Decentralized Identity
                </div>
              </div>
              <div className="bg-card retro-border retro-shadow retro-shadow-hover p-3 text-center">
                <div className="text-lg font-black font-retro text-primary mb-1">FIDE</div>
                <div className="text-xs font-bold uppercase tracking-wider text-card-foreground">
                  Official Ratings
                </div>
              </div>
              <div className="bg-card retro-border retro-shadow retro-shadow-hover p-3 text-center">
                <div className="text-lg font-black font-retro text-primary mb-1">DAO</div>
                <div className="text-xs font-bold uppercase tracking-wider text-card-foreground">
                  Community Governance
                </div>
              </div>
              <div className="bg-card retro-border retro-shadow retro-shadow-hover p-3 text-center">
                <div className="text-lg font-black font-retro text-primary mb-1">NFT</div>
                <div className="text-xs font-bold uppercase tracking-wider text-card-foreground">
                  Match Rewards
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="relative z-10 flex-1 flex flex-col text-center justify-center px-8 lg:px-12 xl:px-16">
          <div className="max-w-lg w-full">

            {/* Step Indicator */}
            <div className="mb-4">
              <div className="bg-card retro-border retro-shadow p-3 inline-block">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 retro-border text-xs font-bold font-retro ${
                    currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    1
                  </div>
                  <div className={`w-16 h-2 retro-border ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 retro-border text-xs font-bold font-retro ${
                    currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </div>
                </div>
              </div>
            </div>
            {/* Form Content */}
            <div className="bg-card retro-border retro-shadow p-8">
              {currentStep === 1 ? (
                /* Step 1: ENS Name */
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-black font-heading text-foreground mb-1 uppercase">Step 1: Choose Your Name</h2>
                    <p className="text-muted-foreground font-retro text-xs">Enter your desired ENS name</p>
                  </div>

                  <div className="relative mb-4">
          <div className="relative">
            <input
              type="text"
              value={ensName}
              onChange={handleEnsNameChange}
              placeholder="SEARCH FOR A NAME"
                        className="w-full px-4 py-3 text-sm retro-border focus:outline-none transition-all duration-200 font-retro bg-background text-foreground placeholder:text-muted-foreground"
            />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg
                          className="w-4 h-4 text-muted-foreground"
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
          
          {ensName && (
            <div className="mt-3 text-center">
                        <div className="inline-flex items-center px-3 py-1 bg-primary text-primary-foreground retro-border font-retro text-xs">
                  {ensName.toLowerCase()}
                          <span className="text-primary-foreground/70">.chess.eth</span>
              </div>
            </div>
          )}
        </div>

        {!isConnected ? (
                    <div className="text-center mb-4">
                      <div className="bg-destructive/10 retro-border retro-shadow p-3">
                        <div className="text-destructive font-bold font-retro text-xs mb-1 uppercase">Wallet Not Connected</div>
                        <div className="text-xs text-destructive/80">
                          Please connect your wallet to continue.
              </div>
            </div>
          </div>
        ) : (
                    <div className="bg-muted retro-border retro-shadow p-3 mb-4">
                      <div className="text-xs text-muted-foreground mb-1 font-bold font-retro uppercase">Connected Wallet:</div>
                      <div className="font-mono text-xs text-foreground break-all">
                {walletAddress}
            </div>
          </div>
        )}

                  <Button
                    onClick={handleNextStep}
                    disabled={!isConnected || !ensName.trim()}
                    size="lg"
                    className="w-full text-sm px-6 py-3 font-bold uppercase tracking-wider font-retro"
                  >
                    Next
                  </Button>
                </>
              ) : (
                /* Step 2: Chess IDs */
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-black font-heading text-foreground mb-1 uppercase">Step 2: Chess Profile</h2>
                    <p className="text-muted-foreground font-retro text-xs">Add your chess platform IDs (optional)</p>
                  </div>

                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold font-retro text-foreground mb-1 uppercase">
                        Chess.com Username
                      </label>
                      <input
                        type="text"
                        value={chessComId}
                        onChange={(e) => setChessComId(e.target.value)}
                        placeholder="Enter your Chess.com username"
                        className="w-full px-3 py-2 text-sm retro-border focus:outline-none transition-all duration-200 font-retro bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-retro text-foreground mb-1 uppercase">
                        FIDE ID
                      </label>
                      <input
                        type="text"
                        value={fideId}
                        onChange={(e) => setFideId(e.target.value)}
                        placeholder="Enter your FIDE ID"
                        className="w-full px-3 py-2 text-sm retro-border focus:outline-none transition-all duration-200 font-retro bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-retro text-foreground mb-1 uppercase">
                        Lichess Username
                      </label>
                      <input
                        type="text"
                        value={lichessId}
                        onChange={(e) => setLichessId(e.target.value)}
                        placeholder="Enter your Lichess username"
                        className="w-full px-3 py-2 text-sm retro-border focus:outline-none transition-all duration-200 font-retro bg-background text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="bg-primary retro-border retro-shadow p-3 mb-4">
                    <div className="text-xs text-primary-foreground mb-1 font-bold font-retro uppercase">Your ENS Name:</div>
                    <div className="text-sm font-bold font-retro text-primary-foreground">
                      {ensName.toLowerCase()}
                      <span className="text-primary-foreground/70">.chess.eth</span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={handlePrevStep}
                      variant="secondary"
                      size="lg"
                      className="flex-1 text-sm px-4 py-3 font-bold uppercase tracking-wider font-retro"
                    >
                      Back
                    </Button>
        <Button
          onClick={handleMint}
                      disabled={!isConnected || isMinting}
          size="lg"
                      className="flex-1 text-sm px-4 py-3 font-bold uppercase tracking-wider font-retro"
        >
          {isMinting ? 'Minting...' : 'Mint ENS'}
        </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Profile Elements (Decorative) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-36 left-50 w-16 h-16 bg-primary/20 retro-border retro-pulse"></div>
        <div className="absolute top-16 right-20 w-12 h-12 bg-secondary/20 retro-border retro-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-14 h-14 bg-accent/20 retro-border retro-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-10 w-10 h-10 bg-primary/30 retro-border retro-pulse delay-500"></div>
      </div>
    </div>
  );
};

export default CreateENSPage;
