'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trophy, RefreshCw, Wallet } from 'lucide-react';
import { useContests } from '@/hooks/useContests';
import CreateContestModal from '@/components/contest/CreateContestModal';
import ContestList from '@/components/contest/ContestList';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';

export default function ContestsPage() {
  const { 
    contests, 
    loading, 
    error, 
    refreshContests, 
    getETHBalance 
  } = useContests();
  const { isConnected, address } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ethBalance, setEthBalance] = useState('0');

  // Load ETH balance
  const loadETHBalance = async () => {
    try {
      const balance = await getETHBalance();
      setEthBalance(balance);
    } catch (error) {
      console.error('Error loading ETH balance:', error);
    }
  };

  // Load balance on mount
  useEffect(() => {
    if (isConnected) {
      loadETHBalance();
    }
  }, [isConnected]);

  const handleRefresh = async () => {
    try {
      await refreshContests();
      await loadETHBalance();
      toast.success('Contests refreshed');
    } catch (error) {
      toast.error('Failed to refresh contests');
    }
  };

  const { joinContest, endContest } = useContests();

  const handleJoinContest = async (contestId: bigint) => {
    try {
      await joinContest(contestId);
      toast.success('Successfully joined contest!');
      await refreshContests();
    } catch (error: any) {
      console.error('Error joining contest:', error);
      toast.error(error.message || 'Failed to join contest');
    }
  };

  const handleEndContest = async (contestId: bigint, winners: [string, string, string]) => {
    try {
      await endContest(contestId, winners);
      toast.success('Contest ended successfully!');
      await refreshContests();
    } catch (error: any) {
      console.error('Error ending contest:', error);
      toast.error(error.message || 'Failed to end contest');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500">Please connect your wallet to view and create contests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Chess Contests
            </h1>
            <p className="text-gray-600">
              Create and join chess tournaments with RIF token prizes on Rootstock
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
              <div className="text-sm text-gray-500">ETH Balance</div>
              <div className="font-semibold text-gray-900">
                {parseFloat(ethBalance).toFixed(6)} ETH
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Contest
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {contests.length}
                </div>
                <div className="text-sm text-gray-500">Total Contests</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {contests.filter(c => c.isActive && !c.isEnded).length}
                </div>
                <div className="text-sm text-gray-500">Active Contests</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {contests.reduce((sum, c) => sum + parseFloat(c.totalPrizePoolFormatted), 0).toFixed(6)}
                </div>
                <div className="text-sm text-gray-500">Total Prize Pool (ETH)</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Contests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Contests</h2>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          <ContestList
            contests={contests}
            onJoinContest={handleJoinContest}
            onEndContest={handleEndContest}
          />
        </div>

        {/* Create Contest Modal */}
        <CreateContestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </div>
    </div>
  );
}
