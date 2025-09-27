'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../retroui/Button';
// import { Card } from '../retroui/Card';

interface Player {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  rating: number;
  score: number;
  wins: number;
  losses: number;
  draws: number;
  byes: number;
  buchholzScore: number;
  sonnebornBerger: number;
}

interface Pairing {
  boardNumber: number;
  white: {
    id: string;
    username: string;
    displayName: string;
    rating: number;
    score: number;
  };
  black: {
    id: string;
    username: string;
    displayName: string;
    rating: number;
    score: number;
  };
  isBye: boolean;
}

interface Round {
  id: string;
  roundNumber: number;
  status: 'pending' | 'active' | 'completed';
  startAt: string | null;
  endAt: string | null;
  games: Array<{
    id: string;
    white: any;
    black: any;
    winner: any;
    result: string | null;
    status: string;
  }>;
}

interface SwissTournamentManagerProps {
  contestId: string;
  contestStatus: string;
  currentRound: number;
  totalRounds: number;
  onTournamentUpdateAction: () => void;
}

export const SwissTournamentManager: React.FC<SwissTournamentManagerProps> = ({
  contestId,
  contestStatus,
  currentRound,
  totalRounds,
  onTournamentUpdateAction
}) => {
  const [standings, setStandings] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentPairings, setCurrentPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tournament data
  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch standings
      const standingsResponse = await fetch(`/api/contests/${contestId}/standings`);
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json();
        setStandings(standingsData.data.standings || []);
      }

      // Fetch rounds
      const roundsResponse = await fetch(`/api/contests/${contestId}/rounds`);
      if (roundsResponse.ok) {
        const roundsData = await roundsResponse.json();
        setRounds(roundsData.data.rounds || []);
      }
    } catch (err) {
      setError('Failed to fetch tournament data');
      console.error('Error fetching tournament data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contestStatus === 'active' || contestStatus === 'completed') {
      fetchTournamentData();
    }
  }, [contestId, contestStatus]);

  // Start Swiss tournament
  const startTournament = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contests/${contestId}/start-tournament`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        onTournamentUpdateAction();
        fetchTournamentData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start tournament');
      }
    } catch (err) {
      setError('Failed to start tournament');
      console.error('Error starting tournament:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start a round
  const startRound = async (roundNumber: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contests/${contestId}/rounds/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roundNumber }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPairings(data.data.pairings || []);
        onTournamentUpdateAction();
        fetchTournamentData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to start round');
      }
    } catch (err) {
      setError('Failed to start round');
      console.error('Error starting round:', err);
    } finally {
      setLoading(false);
    }
  };

  // Complete a round
  const completeRound = async (roundNumber: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contests/${contestId}/rounds/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roundNumber }),
      });

      if (response.ok) {
        onTournamentUpdateAction();
        fetchTournamentData();
        setCurrentPairings([]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to complete round');
      }
    } catch (err) {
      setError('Failed to complete round');
      console.error('Error completing round:', err);
    } finally {
      setLoading(false);
    }
  };

  // Complete tournament
  const completeTournament = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/contests/${contestId}/complete-tournament`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        onTournamentUpdateAction();
        fetchTournamentData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to complete tournament');
      }
    } catch (err) {
      setError('Failed to complete tournament');
      console.error('Error completing tournament:', err);
    } finally {
      setLoading(false);
    }
  };

  if (contestStatus === 'registration') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Swiss Tournament Management</h3>
        <p className="text-gray-600">
          Start the Swiss tournament when all participants have joined.
        </p>
        <Button 
          onClick={startTournament}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Starting...' : 'Start Swiss Tournament'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Swiss Tournament</h3>
        <div className="text-sm text-gray-600">
          Round {currentRound} of {totalRounds}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Tournament Controls */}
      <div className="flex gap-2">
        {contestStatus === 'active' && currentRound < totalRounds && (
          <Button
            onClick={() => startRound(currentRound + 1)}
            disabled={loading}
            variant="outline"
          >
            Start Round {currentRound + 1}
          </Button>
        )}
        
        {contestStatus === 'active' && currentRound > 0 && (
          <Button
            onClick={() => completeRound(currentRound)}
            disabled={loading}
            variant="outline"
          >
            Complete Round {currentRound}
          </Button>
        )}
        
        {contestStatus === 'active' && currentRound >= totalRounds && (
          <Button
            onClick={completeTournament}
            disabled={loading}
            variant="outline"
          >
            Complete Tournament
          </Button>
        )}
      </div>

      {/* Current Round Pairings */}
      {currentPairings.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold mb-3">Current Round Pairings</h4>
          <div className="space-y-2">
            {currentPairings.map((pairing) => (
              <div key={pairing.boardNumber} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-4">
                  <span className="font-mono text-sm">Board {pairing.boardNumber}</span>
                  {pairing.isBye ? (
                    <span className="text-gray-600">
                      {pairing.white.displayName} (Bye)
                    </span>
                  ) : (
                    <>
                      <span className="font-medium">{pairing.white.displayName}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="font-medium">{pairing.black.displayName}</span>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {pairing.white.score} - {pairing.black.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tournament Standings */}
      {standings.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold mb-3">Current Standings</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Player</th>
                  <th className="text-left p-2">Rating</th>
                  <th className="text-left p-2">Score</th>
                  <th className="text-left p-2">W-L-D</th>
                  <th className="text-left p-2">Buchholz</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, index) => (
                  <tr key={player.id} className="border-b">
                    <td className="p-2 font-medium">{index + 1}</td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{player.displayName}</div>
                        <div className="text-gray-500 text-xs">@{player.username}</div>
                      </div>
                    </td>
                    <td className="p-2">{player.rating}</td>
                    <td className="p-2 font-medium">{player.score}</td>
                    <td className="p-2">{player.wins}-{player.losses}-{player.draws}</td>
                    <td className="p-2">{player.buchholzScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tournament Rounds */}
      {rounds.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="font-semibold mb-3">Tournament Rounds</h4>
          <div className="space-y-2">
            {rounds.map((round) => (
              <div key={round.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">Round {round.roundNumber}</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${
                    round.status === 'completed' ? 'bg-green-100 text-green-800' :
                    round.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {round.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {round.games.length} games
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
