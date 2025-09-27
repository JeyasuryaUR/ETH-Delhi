'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/retro-button';
import { ArrowLeft, Trophy, Medal, Award, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContestStandings, ContestStanding, ContestData } from '@/hooks/useContestStandings';



const PodiumCard = ({ player, position, delay }: { player: ContestStanding; position: 'left' | 'center' | 'right'; delay: number }) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'left':
        return 'order-2 md:order-1';
      case 'center':
        return 'order-1 md:order-2';
      case 'right':
        return 'order-3 md:order-3';
    }
  };

  const getMedalColor = () => {
    switch (position) {
      case 'left':
        return 'text-gray-400'; // Silver
      case 'center':
        return 'text-yellow-500'; // Gold
      case 'right':
        return 'text-amber-600'; // Bronze
    }
  };

  const getPodiumHeight = () => {
    switch (position) {
      case 'left':
        return 'h-32'; // 2nd place
      case 'center':
        return 'h-40'; // 1st place
      case 'right':
        return 'h-24'; // 3rd place
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`flex flex-col items-center ${getPositionStyles()}`}
    >
      {/* Player Card */}
      <div className="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 mb-4 w-64">
        <div className="text-center">
          {/* Medal */}
          <div className={`flex justify-center mb-4 ${getMedalColor()}`}>
            {position === 'center' ? (
              <Crown className="h-12 w-12" />
            ) : (
              <Medal className="h-10 w-10" />
            )}
          </div>
          
          {/* Player Info */}
          <h3 className="text-xl font-bold mb-2">{player.ensAddress}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Rank:</span>
              <span className="font-bold">#{player.rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rating:</span>
              <span className="font-bold">{player.rating}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Points:</span>
              <span className="font-bold text-green-600">{player.points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Record:</span>
              <span className="font-bold">{player.wins}-{player.losses}-{player.draws}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Podium Base */}
      <div className={`w-32 ${getPodiumHeight()} bg-gradient-to-t from-gray-300 to-gray-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-t-lg flex items-end justify-center pb-2`}>
        <span className="text-2xl font-bold text-gray-800">#{player.rank}</span>
      </div>
    </motion.div>
  );
};

const TopTenList = ({ standings }: { standings: ContestStanding[] }) => {
  const topTen = standings.slice(3, 10); // Get positions 4-10

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
    >
      <div className="flex items-center justify-center mb-6">
        <Trophy className="h-6 w-6 text-primary mr-3" />
        <h2 className="text-2xl font-bold">Top 10 Players</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-3 px-4 font-bold">Rank</th>
              <th className="text-left py-3 px-4 font-bold">ENS Address</th>
              <th className="text-left py-3 px-4 font-bold">Rating</th>
              <th className="text-left py-3 px-4 font-bold">Points</th>
            </tr>
          </thead>
          <tbody>
            {topTen.map((player, index) => (
              <tr
                key={player.rank}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">#{player.rank}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                      {player.ensAddress.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{player.ensAddress}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-bold">{player.rating}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-green-600">{player.points}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default function ContestStandingsPage() {
  const router = useRouter();
  
  // Get contest ID from URL params (you might want to use useParams or query params)
  const contestId = 'contest-001'; // Replace with actual contest ID from URL
  
  // Use the custom hook for API integration
  const { contestData, loading, error, refetch } = useContestStandings(contestId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contest standings...</p>
        </div>
      </div>
    );
  }

  if (error || !contestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Contest not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const topThree = contestData.standings.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contest
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-black text-gray-800 mb-2">
              Contest Standings
            </h1>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              {contestData.contestName}
            </h2>
            <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
              <div>
                <span className="font-semibold">Total Participants:</span> {contestData.totalParticipants}
              </div>
              <div>
                <span className="font-semibold">Ended:</span> {new Date(contestData.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Podium Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row justify-center items-end gap-4 mb-8">
            {topThree.length >= 2 && (
              <PodiumCard player={topThree[1]} position="left" delay={0.2} />
            )}
            {topThree.length >= 1 && (
              <PodiumCard player={topThree[0]} position="center" delay={0.4} />
            )}
            {topThree.length >= 3 && (
              <PodiumCard player={topThree[2]} position="right" delay={0.6} />
            )}
          </div>
        </div>

        {/* Top 10 List */}
        <div className="mb-8">
          <TopTenList standings={contestData.standings} />
        </div>

        {/* Contest Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
        >
          <h3 className="text-xl font-bold mb-4 text-center">Contest Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{contestData.totalParticipants}</div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{contestData.standings[0]?.points || 0}</div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{contestData.standings[0]?.rating || 0}</div>
              <div className="text-sm text-gray-600">Top Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((contestData.standings.reduce((sum, p) => sum + p.wins, 0) / 
                  contestData.standings.reduce((sum, p) => sum + p.wins + p.losses + p.draws, 0)) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Win Rate</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
