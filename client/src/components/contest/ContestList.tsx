'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Coins, 
  Clock, 
  Play, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Crown
} from 'lucide-react';
import { ContestDisplayInfo } from '@/hooks/useContests';
import { useContests } from '@/hooks/useContests';
import toast from 'react-hot-toast';

interface ContestListProps {
  contests: ContestDisplayInfo[];
  onJoinContest?: (contestId: bigint) => void;
  onEndContest?: (contestId: bigint, winners: [string, string, string]) => void;
}

export default function ContestList({ contests, onJoinContest, onEndContest }: ContestListProps) {
  const { joinContest } = useContests();
  const [joiningContest, setJoiningContest] = useState<bigint | null>(null);
  const [endingContest, setEndingContest] = useState<bigint | null>(null);
  const [winners, setWinners] = useState<[string, string, string]>(['', '', '']);

  const handleJoinContest = async (contestId: bigint) => {
    try {
      setJoiningContest(contestId);
      await joinContest(contestId);
      toast.success('Successfully joined contest!');
      onJoinContest?.(contestId);
    } catch (error: any) {
      console.error('Error joining contest:', error);
      toast.error(error.message || 'Failed to join contest');
    } finally {
      setJoiningContest(null);
    }
  };

  const handleEndContest = async (contestId: bigint) => {
    if (winners.some(w => !w.trim())) {
      toast.error('Please provide all three winners');
      return;
    }

    try {
      setEndingContest(contestId);
      await endContest(contestId, winners);
      toast.success('Contest ended successfully!');
      onEndContest?.(contestId, winners);
      setWinners(['', '', '']);
    } catch (error: any) {
      console.error('Error ending contest:', error);
      toast.error(error.message || 'Failed to end contest');
    } finally {
      setEndingContest(null);
    }
  };

  const getStatusColor = (contest: ContestDisplayInfo) => {
    if (contest.isEnded) return 'bg-gray-100 text-gray-600';
    if (contest.isActive) return 'bg-green-100 text-green-600';
    return 'bg-yellow-100 text-yellow-600';
  };

  const getStatusText = (contest: ContestDisplayInfo) => {
    if (contest.isEnded) return 'Ended';
    if (contest.isActive) return 'Active';
    return 'Upcoming';
  };

  const getStatusIcon = (contest: ContestDisplayInfo) => {
    if (contest.isEnded) return <XCircle className="w-4 h-4" />;
    if (contest.isActive) return <Play className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {contests.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Contests Yet</h3>
          <p className="text-gray-500">Be the first to create a contest!</p>
        </div>
      ) : (
        contests.map((contest) => (
          <motion.div
            key={contest.contestId.toString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contest #{contest.contestId.toString()}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(contest)}`}>
                      {getStatusIcon(contest)}
                      {getStatusText(contest)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {contest.totalPrizePoolFormatted} ETH
                </div>
                <div className="text-sm text-gray-500">Total Prize Pool</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Users className="w-4 h-4" />
                  Participants
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {contest.participantCountFormatted}/{contest.maxParticipantsFormatted}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Coins className="w-4 h-4" />
                  Entry Fee
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {contest.participantStake} ETH
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Crown className="w-4 h-4" />
                  Organizer
                </div>
                <div className="text-sm font-medium text-gray-900 truncate">
                  {contest.organizer.slice(0, 6)}...{contest.organizer.slice(-4)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Trophy className="w-4 h-4" />
                  Initial Pool
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {contest.initialPrizePoolFormatted} ETH
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {contest.isParticipant ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    You're participating
                  </span>
                ) : (
                  <span className="text-gray-500">Not participating</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {!contest.isEnded && !contest.isParticipant && contest.isActive && (
                  <button
                    onClick={() => handleJoinContest(contest.contestId)}
                    disabled={joiningContest === contest.contestId}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {joiningContest === contest.contestId ? 'Joining...' : 'Join Contest'}
                  </button>
                )}
                
                {contest.isActive && contest.organizer === '0x...' && ( // Check if current user is organizer
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="1st place address"
                        value={winners[0]}
                        onChange={(e) => setWinners([e.target.value, winners[1], winners[2]])}
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="2nd place address"
                        value={winners[1]}
                        onChange={(e) => setWinners([winners[0], e.target.value, winners[2]])}
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="3rd place address"
                        value={winners[2]}
                        onChange={(e) => setWinners([winners[0], winners[1], e.target.value])}
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleEndContest(contest.contestId)}
                      disabled={endingContest === contest.contestId}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {endingContest === contest.contestId ? 'Ending...' : 'End Contest'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
