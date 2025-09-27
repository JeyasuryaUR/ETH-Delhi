'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, Trophy, RefreshCw, Play, Eye } from 'lucide-react';
import { Button } from '@/components/retroui/Button';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface Player {
  id: string;
  wallet_address: string;
  username: string;
  display_name: string;
  rating_cached: number;
}

interface Pairing {
  id: string;
  white: Player;
  black: Player;
  result?: string;
  started_at?: string;
  ended_at?: string;
}

interface RoundPairings {
  roundNumber: number;
  totalRounds: number;
  contestStatus: string;
  roundStatus: string;
  pairings: Pairing[];
}

export default function ContestPairingsPage() {
  const router = useRouter();
  const params = useParams();
  const contestId = params.id as string;

  const [pairingsData, setPairingsData] = useState<RoundPairings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, primaryWallet} = useDynamicContext();

  const fetchPairings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/contests/${contestId}/pairings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pairings');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setPairingsData(data.data);
      } else {
        setError(data.message || 'No pairings found');
      }
    } catch (error) {
      console.error('Error fetching pairings:', error);
      setError('Failed to load pairings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contestId) {
      fetchPairings();
      
      // Poll for updates every 10 seconds during active rounds
      const interval = setInterval(fetchPairings, 10000);
      return () => clearInterval(interval);
    }
  }, [contestId]);

  const getResultDisplay = (result?: string) => {
    if (!result) {
      return <span className="text-gray-500 font-bold">-</span>;
    }
    
    let resultText = result;
    let resultClass = "font-bold text-lg";
    
    if (result === '1-0') {
      resultClass += " text-green-600";
    } else if (result === '0-1') {
      resultClass += " text-blue-600";
    } else if (result === '1/2-1/2') {
      resultClass += " text-yellow-600";
    }
    
    return <span className={resultClass}>{resultText}</span>;
  };

  const getGameStatusColor = (pairing: Pairing) => {
    if (pairing.result) {
      return "bg-green-100 border-green-300";
    } else if (pairing.started_at) {
      return "bg-yellow-100 border-yellow-300";
    } else {
      return "bg-gray-100 border-gray-300";
    }
  };

  const getGameStatusText = (pairing: Pairing) => {
    if (pairing.result) {
      return "Completed";
    } else if (pairing.started_at) {
      return "In Progress";
    } else {
      return "Not Started";
    }
  };

  const isUserInPairing = (pairing: Pairing) => {
    // const res = pairing.white?.wallet_address.toLowerCase() === primaryWallet.address.toLowerCase() || 
    //   pairing.black?.wallet_address.toLowerCase() === primaryWallet.address.toLowerCase();

    console.log(pairing.white?.wallet_address.toLowerCase(), primaryWallet?.address.toLowerCase(), pairing.black?.wallet_address.toLowerCase());
    return primaryWallet && (
      pairing.white?.wallet_address.toLowerCase() === primaryWallet.address.toLowerCase() || 
      pairing.black?.wallet_address.toLowerCase() === primaryWallet.address.toLowerCase()
    );
  };

  const canUserPlayGame = (pairing: Pairing) => {
    return isUserInPairing(pairing) && !pairing.result;
  };

  const handlePlayGame = (pairing: Pairing) => {
    // Navigate to the tournament game page
    router.push(`/dashboard/chess/contests/${contestId}/game/${pairing.id}`);
  };

  const handleSpectateGame = (pairing: Pairing) => {
    // Navigate to spectate the game
    router.push(`/dashboard/chess/contests/${contestId}/game/${pairing.id}?spectate=true`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pairings...</p>
        </div>
      </div>
    );
  }

  if (error || !pairingsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'No pairings found'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isRoundComplete = pairingsData.pairings.every(p => p.result);
  const isTournamentComplete = pairingsData.contestStatus === 'completed';
  
  // Find user's games in current round
  const userGames = pairingsData.pairings.filter(p => isUserInPairing(p));
  const userUnfinishedGames = userGames.filter(p => !p.result);

  return (
    <div className="pt-24 bg-gradient-to-br from-primary/5 to-background">
      <div className="py-2 px-6">
        <div className="max-w-6xl mx-auto">
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

            {/* User's Games Alert */}
            {primaryWallet && userUnfinishedGames.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 retro-border-thick retro-shadow-lg p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black font-retro text-white mb-1">
                        YOUR TURN TO PLAY!
                      </h3>
                      <p className="text-blue-100">
                        You have {userUnfinishedGames.length} game{userUnfinishedGames.length > 1 ? 's' : ''} waiting. 
                        Click "Play" to join your match.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {userUnfinishedGames.slice(0, 2).map((game) => (
                        <Button
                          key={game.id}
                          onClick={() => handlePlayGame(game)}
                          className="bg-white text-blue-600 hover:bg-blue-50 font-retro"
                          size="sm"
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Play Game
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-card retro-border-thick retro-shadow-lg p-8 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary border-2 border-black rounded-lg flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black text-foreground font-retro uppercase">
                      Round {pairingsData.roundNumber}
                    </h1>
                    <p className="text-lg font-bold text-muted-foreground">
                      of {pairingsData.totalRounds} • {pairingsData.pairings.length} matches
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={fetchPairings}
                    variant="outline"
                    size="sm"
                    className="retro-border font-retro"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  
                  <div className={`px-4 py-2 rounded-lg border-2 border-black font-retro font-bold uppercase text-sm ${
                    isTournamentComplete 
                      ? 'bg-gray-500 text-white'
                      : isRoundComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-400 text-black'
                  }`}>
                    {isTournamentComplete 
                      ? 'Tournament Complete'
                      : isRoundComplete 
                      ? 'Round Complete'
                      : 'In Progress'
                    }
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tournament Complete Message */}
          {isTournamentComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 retro-border-thick retro-shadow-lg p-8 rounded-lg text-center">
                <Trophy className="h-16 w-16 text-yellow-800 mx-auto mb-4" />
                <h2 className="text-3xl font-black font-retro text-yellow-800 mb-2">
                  TOURNAMENT COMPLETE!
                </h2>
                <p className="text-yellow-800 font-bold text-lg">
                  All games have been played. Check the standings for final results!
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/chess/contests/${contestId}/standings`)}
                  className="mt-4 bg-yellow-800 hover:bg-yellow-900 text-yellow-100"
                  size="lg"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  View Final Standings
                </Button>
              </div>
            </motion.div>
          )}

          {/* Pairings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card retro-border-thick retro-shadow-lg rounded-lg overflow-hidden"
          >
            <div className="bg-primary text-primary-foreground p-4">
              <h2 className="text-2xl font-black font-retro uppercase">Current Round Pairings</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-black">
                    <th className="text-left py-4 px-6 font-retro font-bold uppercase text-sm">Board</th>
                    <th className="text-left py-4 px-6 font-retro font-bold uppercase text-sm">White Player</th>
                    <th className="text-left py-4 px-6 font-retro font-bold uppercase text-sm">Rating</th>
                    <th className="text-center py-4 px-6 font-retro font-bold uppercase text-sm">Result</th>
                    <th className="text-right py-4 px-6 font-retro font-bold uppercase text-sm">Rating</th>
                    <th className="text-right py-4 px-6 font-retro font-bold uppercase text-sm">Black Player</th>
                    <th className="text-center py-4 px-6 font-retro font-bold uppercase text-sm">Status</th>
                    <th className="text-center py-4 px-6 font-retro font-bold uppercase text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pairingsData.pairings.map((pairing, index) => (
                    <motion.tr
                      key={pairing.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`border-b hover:bg-gray-50 transition-colors ${getGameStatusColor(pairing)}`}
                    >
                      <td className="py-4 px-6">
                        <span className="font-bold text-lg font-retro">#{index + 1}</span>
                      </td>
                      
                      {/* White Player */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-lg">
                          {pairing.white?.username || 'BYE'}
                        </div>
                        {pairing.white?.display_name && (
                          <div className="text-sm text-gray-600">
                            {pairing.white.display_name}
                          </div>
                        )}
                      </td>
                      
                      {/* White Rating */}
                      <td className="py-4 px-6">
                        <span className="font-bold">
                          {pairing.white?.rating_cached || '-'}
                        </span>
                      </td>
                      
                      {/* Result */}
                      <td className="py-4 px-6 text-center">
                        <div className="bg-white border-2 border-black rounded-lg px-4 py-2 min-w-[80px] inline-flex items-center justify-center">
                          {getResultDisplay(pairing.result)}
                        </div>
                      </td>
                      
                      {/* Black Rating */}
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold">
                          {pairing.black?.rating_cached || '-'}
                        </span>
                      </td>
                      
                      {/* Black Player */}
                      <td className="py-4 px-6 text-right">
                        <div className="font-bold text-lg">
                          {pairing.black?.username || 'BYE'}
                        </div>
                        {pairing.black?.display_name && (
                          <div className="text-sm text-gray-600">
                            {pairing.black.display_name}
                          </div>
                        )}
                      </td>
                      
                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold font-retro uppercase ${
                          pairing.result 
                            ? 'bg-green-500 text-white'
                            : pairing.started_at
                            ? 'bg-yellow-400 text-black'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          <Clock className="mr-1 h-3 w-3" />
                          {getGameStatusText(pairing)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex gap-2 justify-center">
                          {/* Play Game Button - Only for participants */}
                          {canUserPlayGame(pairing) && (
                            <Button
                              onClick={() => handlePlayGame(pairing)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white font-retro"
                            >
                              <Play className="mr-1 h-3 w-3" />
                              {pairing.started_at ? 'Resume' : 'Play'}
                            </Button>
                          )}
                          
                          {/* Spectate Button - For ongoing games */}
                          {pairing.started_at && !pairing.result && (
                            <Button
                              onClick={() => handleSpectateGame(pairing)}
                              size="sm"
                              variant="outline"
                              className="font-retro"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Watch
                            </Button>
                          )}
                          
                          {/* Game Complete - View Game */}
                          {pairing.result && (
                            <Button
                              onClick={() => handleSpectateGame(pairing)}
                              size="sm"
                              variant="outline"
                              className="font-retro"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Review
                            </Button>
                          )}
                          
                          {/* If user is not in this pairing and game hasn't started */}
                          {!pairing.started_at && !pairing.result && !isUserInPairing(pairing) && (
                            <span className="text-gray-400 text-sm font-retro">Waiting...</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Round Status Footer */}
            <div className="bg-gray-50 p-4 border-t-2 border-black">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <strong>{pairingsData.pairings.filter(p => p.result).length}</strong> of{' '}
                  <strong>{pairingsData.pairings.length}</strong> games completed
                </div>
                
                {isRoundComplete && !isTournamentComplete && (
                  <div className="text-sm font-bold text-green-600 font-retro uppercase">
                    ⏳ Next round starts automatically in 10 seconds...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}