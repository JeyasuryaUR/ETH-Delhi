'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Users, Coins, AlertCircle, CheckCircle } from 'lucide-react';
import { useContests } from '@/hooks/useContests';
import { parseUnits, formatUnits } from 'viem';
import { RIF_TOKEN } from '@/lib/contracts';
import toast from 'react-hot-toast';

interface CreateContestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateContestModal({ isOpen, onClose }: CreateContestModalProps) {
  const { createContest, getETHBalance } = useContests();
  const [prizePool, setPrizePool] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'create' | 'success'>('form');
  const [ethBalance, setEthBalance] = useState('0');
  const [txHash, setTxHash] = useState('');

  // Load ETH balance
  useEffect(() => {
    if (isOpen) {
      loadETHData();
    }
  }, [isOpen]);

  const loadETHData = async () => {
    try {
      const balance = await getETHBalance();
      setEthBalance(balance);
    } catch (error) {
      console.error('Error loading ETH data:', error);
    }
  };

  const handleCreateContest = async () => {
    if (!prizePool || !maxParticipants) {
      toast.error('Please fill in all fields');
      return;
    }

    const prizePoolNum = parseFloat(prizePool);
    const maxParticipantsNum = parseInt(maxParticipants);

    if (prizePoolNum <= 0) {
      toast.error('Prize pool must be greater than 0');
      return;
    }

    if (maxParticipantsNum < 2) {
      toast.error('Maximum participants must be at least 2');
      return;
    }

    if (prizePoolNum > parseFloat(ethBalance)) {
      toast.error('Insufficient ETH balance');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create contest with ETH payment
      setStep('create');
      const hash = await createContest(prizePool, maxParticipantsNum);
      setTxHash(hash);
      setStep('success');
      toast.success('Contest created successfully!');
      
      // Reset form
      setPrizePool('');
      setMaxParticipants('');
      
    } catch (error: any) {
      console.error('Error creating contest:', error);
      toast.error(error.message || 'Failed to create contest');
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setPrizePool('');
    setMaxParticipants('');
    setTxHash('');
    onClose();
  };

  const participantStake = prizePool ? (parseFloat(prizePool) * 0.01).toFixed(6) : '0';
  const organizerReward = prizePool ? (parseFloat(prizePool) * 0.1).toFixed(6) : '0';
  const winnersShare = prizePool ? (parseFloat(prizePool) * 0.9).toFixed(6) : '0';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Create Contest
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === 'form' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prize Pool (ETH)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.000001"
                      value={prizePool}
                      onChange={(e) => setPrizePool(e.target.value)}
                      placeholder="0.001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      ETH
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your ETH Balance: {parseFloat(ethBalance).toFixed(6)} ETH
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {prizePool && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-gray-900">Contest Economics</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Participant Stake (1%):</span>
                        <span className="font-medium">{participantStake} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Organizer Reward (10%):</span>
                        <span className="font-medium">{organizerReward} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Winners Share (90%):</span>
                        <span className="font-medium">{winnersShare} ETH</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreateContest}
                  disabled={isLoading || !prizePool || !maxParticipants}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create Contest'}
                </button>
              </div>
            )}


            {step === 'create' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Coins className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Creating Contest</h3>
                <p className="text-gray-600">
                  Your contest is being created on the blockchain. This may take a few moments.
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Contest Created!</h3>
                <p className="text-gray-600">
                  Your contest has been successfully created on Rootstock.
                </p>
                {txHash && (
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                    <p className="text-sm font-mono break-all">{txHash}</p>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
