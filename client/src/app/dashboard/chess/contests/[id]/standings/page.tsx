'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Crown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/retroui/Button';

interface ContestStanding {
  rank: number;
  ensAddress: string;
  rating: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  buchholz: number;
  sonnebornBerger: number;
}

interface ContestData {
  contestName: string;
  contestStatus: string;
  currentRound: number;
  totalRounds: number;
  totalParticipants: number;
  endDate: string;
  standings: ContestStanding[];
}

const PodiumCard = ({ 
  player, 
  position, 
  delay 
}: { 
  player: ContestStanding; 
  position: 'left' | 'center' | 'right'; 
  delay: number 
}) => {
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

  const getBgColor = () => {
    switch (position) {
      case 'left':
        return 'bg-gradient-to-t from-gray-300 to-gray-200';
      case 'center':
        return 'bg-gradient-to-t from-yellow-400 to-yellow-300';
      case 'right':
        return 'bg-gradient-to-t from-amber-400 to-amber-300';
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
      <div className="bg-card retro-border-thick retro-shadow-lg p-6 mb-4 w-64">
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
          <h3 className="text-xs truncate ellipses tracking-tight font-black font-retro mb-2">{player.ensAddress}</h3>
          <div className="space-y-2 text-sm font-bold">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rank:</span>
              <span className="text-foreground">#{player.rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rating:</span>
              <span className="text-foreground">{player.rating}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Points:</span>
              <span className="text-green-600 font-black text-lg">{player.points}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Record:</span>
              <span className="text-foreground font-retro">{player.wins}-{player.losses}-{player.draws}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Podium Base */}
      <div className={`w-32 ${getPodiumHeight()} ${getBgColor()} retro-border retro-shadow rounded-t-lg flex items-end justify-center pb-2`}>
        <span className="text-2xl font-black font-retro text-gray-800">#{player.rank}</span>
      </div>
    </motion.div>
  );
};

const TopTenList = ({ standings }: { standings: ContestStanding[] }) => {
  const topTen = standings.slice(0, 13); // Get positions 4-13 (or as many as available)

  if (topTen.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-card retro-border-thick retro-shadow-lg rounded-lg overflow-hidden"
    >
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-center">
          <Trophy className="h-6 w-6 mr-3" />
          <h2 className="text-2xl font-black font-retro uppercase">Top Players</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-black">
              <th className="text-left py-3 px-4 font-retro font-bold uppercase text-sm">Rank</th>
              <th className="text-left py-3 px-4 font-retro font-bold uppercase text-sm">ENS Address</th>
              <th className="text-left py-3 px-4 font-retro font-bold uppercase text-sm">Rating</th>
              <th className="text-left py-3 px-4 font-retro font-bold uppercase text-sm">Points</th>
              <th className="text-left py-3 px-4 font-retro font-bold uppercase text-sm">W-L-D</th>
              <th className="text-left py-3 px-4 font-retro font-bold uppercase text-sm">Buchholz</th>
            </tr>
          </thead>
          <tbody>
            {topTen.map((player, index) => (
              <tr
                key={player.rank}
                className={`border-b hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="py-3 px-4">
                  <span className="text-xl font-black font-retro text-primary">#{player.rank}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-lg">{player.ensAddress}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold">{player.rating}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xl font-black text-green-600">{player.points}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-retro font-bold">{player.wins}-{player.losses}-{player.draws}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-bold text-muted-foreground">{player.buchholz}</span>
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
  const params = useParams();
  const contestId = params.id as string;
  
  const [contestData, setContestData] = useState<ContestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_BASE + `/contests/${contestId}/standings-detailed`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch standings');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setContestData(data.data);
      } else {
        setError(data.message || 'Contest not found');
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
      setError('Failed to load standings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contestId) {
      fetchStandings();
      
      // Poll for updates every 30 seconds during active tournaments
      const interval = setInterval(fetchStandings, 30000);
      return () => clearInterval(interval);
    }
  }, [contestId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-retro">Loading contest standings...</p>
        </div>
      </div>
    );
  }

  if (error || !contestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 font-retro">{error || 'Contest not found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const topThree = contestData.standings.slice(0, 3);

  return (
    <div className="pt-24 bg-gradient-to-br from-primary/5 to-background">
      <div className="py-8 px-6">
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
              className="mb-6 retro-border retro-shadow font-retro"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contest
            </Button>

            <div className="bg-card retro-border-thick retro-shadow-lg p-8 rounded-lg text-center">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary border-2 border-black rounded-lg flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-4xl font-black text-foreground font-retro uppercase">
                      Contest Standings
                    </h1>
                    <h2 className="text-2xl font-bold text-muted-foreground">
                      {contestData.contestName}
                    </h2>
                  </div>
                </div>
                
                <Button
                  onClick={fetchStandings}
                  variant="outline"
                  size="sm"
                  className="retro-border font-retro"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-center items-center gap-8 text-sm font-retro font-bold">
                <div className="text-center">
                  <span className="text-2xl font-black text-primary block">{contestData.totalParticipants}</span>
                  <span className="text-muted-foreground uppercase">Players</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-black text-primary block">{contestData.currentRound}</span>
                  <span className="text-muted-foreground uppercase">of {contestData.totalRounds} Rounds</span>
                </div>
                <div className="text-center">
                  <span className={`text-2xl font-black block ${
                    contestData.contestStatus === 'completed' ? 'text-green-600' : 
                    contestData.contestStatus === 'active' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {contestData.contestStatus.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground uppercase">Status</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Podium Section */}
          {topThree.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-col md:flex-row justify-center items-end gap-4 mb-4">
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
          )}

          {/* Top Players List */}
          <div className="mb-8">
            <TopTenList standings={contestData.standings} />
          </div>

          {/* Contest Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-card retro-border-thick retro-shadow-lg rounded-lg overflow-hidden"
          >
            <div className="bg-secondary text-secondary-foreground p-4">
              <h3 className="text-xl font-black font-retro uppercase text-center">Tournament Statistics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="bg-primary/10 retro-border p-4 rounded-lg">
                  <div className="text-3xl font-black text-primary font-retro">
                    {contestData.totalParticipants}
                  </div>
                  <div className="text-sm text-muted-foreground font-retro uppercase">Participants</div>
                </div>
                <div className="bg-green-100 retro-border p-4 rounded-lg">
                  <div className="text-3xl font-black text-green-600 font-retro">
                    {contestData.standings[0]?.points || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-retro uppercase">Highest Score</div>
                </div>
                <div className="bg-blue-100 retro-border p-4 rounded-lg">
                  <div className="text-3xl font-black text-blue-600 font-retro">
                    {contestData.standings[0]?.rating || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-retro uppercase">Top Rating</div>
                </div>
                <div className="bg-yellow-100 retro-border p-4 rounded-lg">
                  <div className="text-3xl font-black text-yellow-600 font-retro">
                    {contestData.standings[0] ? 
                      Math.round((contestData.standings[0].wins / 
                        (contestData.standings[0].wins + contestData.standings[0].losses + contestData.standings[0].draws)) * 100) || 0
                      : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground font-retro uppercase">Leader Win Rate</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}