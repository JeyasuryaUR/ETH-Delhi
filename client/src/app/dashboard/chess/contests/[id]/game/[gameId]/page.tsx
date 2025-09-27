'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/retroui/Button';
import { ChessBoard } from '@/components/chess/ChessBoard';
import { useChessSocket } from '@/hooks/useChessSocket';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, User, Trophy } from 'lucide-react';
import { useUser } from '@/components/ClientWrapper';

interface Player {
  id: string;
  username: string;
  wallet_address?: string;
  display_name: string;
  rating_cached: number;
}

interface TournamentGame {
  id: string;
  contest_id: string;
  round_number: number;
  white: Player;
  black: Player;
  result?: string;
  started_at?: string;
  ended_at?: string;
  board?: string;
}

interface GameState {
  status: 'loading' | 'ready' | 'waiting-for-ready' | 'playing' | 'finished';
  game: TournamentGame | null;
  board: string;
  turn: 'white' | 'black';
  playerColor: 'white' | 'black' | null;
  winner: string | null;
  winReason: string | null;
  isSpectating: boolean;
  whiteReady: boolean;
  blackReady: boolean;
  isPlayerReady: boolean;
}

export default function TournamentGamePage() {
  const router = useRouter();
  const params = useParams();
  const { primaryWallet, user } = useDynamicContext();
  const { userData } = useUser();
  
  const contestId = params.id as string;
  const gameId = params.gameId as string;

  const [gameState, setGameState] = useState<GameState>({
    status: 'loading',
    game: null,
    board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'white',
    playerColor: null,
    winner: null,
    winReason: null,
    isSpectating: false,
    whiteReady: false,
    blackReady: false,
    isPlayerReady: false
  });

  // Add effect to update game state when wallet info becomes available
  useEffect(() => {
    if (primaryWallet && gameState.game) {
      const userWalletAddress = primaryWallet.address.toLowerCase();
      console.log('User wallet address:', userWalletAddress);
      console.log('Game players:', gameState.game);
      const isPlayerInGame = 
        gameState.game.white.wallet_address?.toLowerCase() === userWalletAddress || 
        gameState.game.black.wallet_address?.toLowerCase() === userWalletAddress;
      
      const playerColor = isPlayerInGame ? 
        (gameState.game.white.wallet_address?.toLowerCase() === userWalletAddress ? 'white' : 'black') : null;

      setGameState(prev => ({
        ...prev,
        playerColor,
        isSpectating: !isPlayerInGame
      }));
    }
  }, [primaryWallet, gameState.game]);

  // Fetch game details
  const fetchGameDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/contests/games/${gameId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch game details');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const game = await data.data;
        setGameState(prev => ({
          ...prev,
          status: game.result ? 'finished' : 'ready',
          game,
          board: game.board || prev.board,
          winner: game.result === '1-0' ? game.white.username : 
                 game.result === '0-1' ? game.black.username : 
                 game.result === '1/2-1/2' ? 'Draw' : null,
          winReason: game.result ? 'Game completed' : null
        }));
      }
    } catch (error) {
      console.error('Error fetching game details:', error);
      router.push(`/dashboard/chess/contests/${contestId}`);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
    }
  }, [gameId]);

  // Socket event handlers for tournament games
  const handleGameFound = useCallback((data: any) => {
    console.log('Tournament game event received:', data);
    
    if (data.status === 'ready') {
      // Both players joined, show ready buttons
      setGameState(prev => ({
        ...prev,
        status: 'waiting-for-ready',
        playerColor: data.playerColor,
        board: data.board || prev.board,
        turn: data.turn || 'white',
        whiteReady: data.whiteReady || false,
        blackReady: data.blackReady || false
      }));
    } else if (data.gameId) {
      // Game actually started
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        playerColor: data.playerColor || prev.playerColor,
        board: data.board || prev.board,
        turn: data.turn || 'white'
      }));
    }
  }, []);

  const handleReadyClick = () => {
    if (gameState.game?.id && !gameState.isPlayerReady) {
      tournamentReady(gameState.game.id);
      setGameState(prev => ({
        ...prev,
        isPlayerReady: true
      }));
    }
  };

  const handleMoveMade = useCallback((data: { move: any; turn: 'white' | 'black'; board: string; moveHistory: string[]; check?: boolean }) => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      turn: data.turn,
      board: data.board
    }));

    console.log('📝 Tournament move:', data.move.san, 'New position:', data.board);
    if (data.check) {
      console.log('⚠️ Check!');
    }
  }, []);

  const handleGameCompleted = useCallback(async (data: { winner: string; reason: string; moveHistory: string[]; finalBoard: string }) => {
    // Submit result to tournament system
    try {
      const result = data.winner === 'draw' ? '1/2-1/2' :
                    data.winner === gameState.game?.white.username ? '1-0' : '0-1';
      
      let winnerId = undefined;
      if (data.winner === gameState.game?.white.username) {
        winnerId = gameState.game?.white.id;
      } else if (data.winner === gameState.game?.black.username) {
        winnerId = gameState.game?.black.id;
      }

      await fetch('http://localhost:8000/api/contests/games/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: gameState.game?.id,
          result,
          winnerId
        }),
      });

      setGameState(prev => ({
        ...prev,
        status: 'finished',
        winner: data.winner,
        winReason: data.reason,
        board: data.finalBoard
      }));

      // Show completion message and redirect after delay
      setTimeout(() => {
        router.push(`/dashboard/chess/contests/${contestId}/pairings`);
      }, 5000);

    } catch (error) {
      console.error('Error submitting game result:', error);
    }
  }, [gameState.game, contestId, router]);

  const handleError = useCallback((error: { message: string }) => {
    console.error('❌ Tournament game error:', error);
  }, []);

  const handleReadyUpdate = useCallback((data: { whiteReady: boolean; blackReady: boolean }) => {
    console.log('Ready state update:', data);
    setGameState(prev => ({
      ...prev,
      whiteReady: data.whiteReady,
      blackReady: data.blackReady
    }));
  }, []);

  // Initialize socket for tournament games
  const { isConnected, makeMove, joinTournamentGame, tournamentReady } = useChessSocket(
    undefined, // No waiting for opponent in tournaments
    handleGameFound,
    handleMoveMade,
    handleGameCompleted,
    undefined, // Handle disconnection differently in tournaments
    handleError,
    handleReadyUpdate
  );

  // Join tournament game when component mounts and we have all required data
  useEffect(() => {
    if (isConnected && gameState.game && primaryWallet && user && !gameState.isSpectating) {
      const player = {
        id: user.userId || primaryWallet.address,
        name: user.username || user.email?.split('@')[0] || 'Player',
        walletAddress: primaryWallet.address
      };
      
      console.log('🏆 Attempting to join tournament game with player data:', {
        gameId: gameState.game.id,
        player,
        gameState: gameState.status,
        isSpectating: gameState.isSpectating
      });
      joinTournamentGame(gameState.game.id, player);
    } else {
      console.log('⏳ Waiting for conditions to join tournament game:', {
        isConnected,
        hasGame: !!gameState.game,
        hasPrimaryWallet: !!primaryWallet,
        hasUser: !!user,
        isSpectating: gameState.isSpectating
      });
    }
  }, [isConnected, gameState.game, primaryWallet, user, gameState.isSpectating, joinTournamentGame]);

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (gameState.game?.id && !gameState.isSpectating) {
      makeMove(gameState.game.id, move);
    }
  };

  const handleGameEnd = (winner: string, reason: string, finalBoard: string, moveHistory: string[]) => {
    // This will trigger the handleGameCompleted callback
    console.log('Game ending:', winner, reason);
  };

  if (gameState.status === 'loading' || !gameState.game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-retro">Loading tournament game...</p>
        </div>
      </div>
    );
  }

  const { game } = gameState;

  return (
    <div className="pt-24 bg-gradient-to-br from-primary/5 to-background">
      <div className="py-4 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/chess/contests/${contestId}/pairings`)}
              className="mb-6 retro-border retro-shadow font-retro"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pairings
            </Button>

            {/* Game Info Header */}
            <div className="bg-card retro-border-thick retro-shadow-lg p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary border-2 border-black rounded-lg flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black font-retro uppercase">
                      Tournament Game - Round {game.round_number}
                    </h1>
                    <p className="text-muted-foreground font-bold">
                      {gameState.isSpectating ? 'Spectating' : 'Playing'} • Game ID: {game.id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-lg border-2 border-black font-retro font-bold uppercase text-sm ${
                  gameState.status === 'finished' 
                    ? 'bg-gray-500 text-white'
                    : gameState.status === 'playing'
                    ? 'bg-green-500 text-white'
                    : gameState.status === 'waiting-for-ready'
                    ? 'bg-blue-500 text-white'
                    : 'bg-yellow-400 text-black'
                }`}>
                  {gameState.status === 'finished' ? 'Game Complete' :
                   gameState.status === 'playing' ? 'In Progress' : 
                   gameState.status === 'waiting-for-ready' ? 'Ready to Start' :
                   'Waiting for Players'}
                </div>
              </div>

              {/* Ready Button Section */}
              {gameState.status === 'waiting-for-ready' && !gameState.isSpectating && (
                <div className="mt-4 text-center">
                  <div className="bg-blue-50 retro-border p-4 rounded-lg mb-4">
                    <h3 className="font-black text-lg mb-2">Ready Check</h3>
                    <div className="flex justify-center items-center space-x-8 mb-4">
                      <div className={`flex items-center space-x-2 ${gameState.whiteReady ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="text-xl">♔</span>
                        <span className="font-bold">White: {gameState.whiteReady ? '✅ Ready' : '⏳ Waiting'}</span>
                      </div>
                      <div className={`flex items-center space-x-2 ${gameState.blackReady ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="text-xl">♚</span>
                        <span className="font-bold">Black: {gameState.blackReady ? '✅ Ready' : '⏳ Waiting'}</span>
                      </div>
                    </div>
                    {!gameState.isPlayerReady && (
                      <Button
                        onClick={handleReadyClick}
                        className="bg-green-500 hover:bg-green-600 text-white retro-border retro-shadow font-retro font-bold px-8 py-3 text-lg"
                      >
                        ✅ I'M READY!
                      </Button>
                    )}
                    {gameState.isPlayerReady && (
                      <div className="bg-green-100 border-2 border-green-500 rounded-lg px-4 py-2 inline-block">
                        <span className="text-green-700 font-bold font-retro">✅ You are ready! Waiting for opponent...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Players */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* White Player */}
                <div className="bg-white retro-border p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xl">♔</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-lg">{game.white.username}</div>
                      <div className="text-sm text-muted-foreground font-bold">
                        Rating: {game.white.rating_cached} • Playing White
                      </div>
                    </div>
                    {gameState.playerColor === 'white' && (
                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-retro font-bold">
                        YOU
                      </div>
                    )}
                  </div>
                </div>

                {/* Black Player */}
                <div className="bg-gray-900 text-white retro-border p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xl text-white">♚</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-lg">{game.black.username}</div>
                      <div className="text-sm text-gray-300 font-bold">
                        Rating: {game.black.rating_cached} • Playing Black
                      </div>
                    </div>
                    {gameState.playerColor === 'black' && (
                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-retro font-bold">
                        YOU
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Game Finished Message */}
          {gameState.status === 'finished' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-green-400 to-green-500 retro-border-thick retro-shadow-lg p-6 rounded-lg text-center">
                <Trophy className="h-12 w-12 text-green-800 mx-auto mb-4" />
                <h2 className="text-2xl font-black font-retro text-green-800 mb-2">
                  GAME COMPLETE!
                </h2>
                <p className="text-green-800 font-bold text-lg">
                  Winner: {gameState.winner} • {gameState.winReason}
                </p>
                <p className="text-green-700 text-sm mt-2">
                  Returning to pairings in 5 seconds...
                </p>
              </div>
            </motion.div>
          )}

          {/* Chess Board */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="bg-card retro-border-thick retro-shadow-lg p-8 rounded-lg">
              <ChessBoard
                position={gameState.board}
                playerColor={gameState.playerColor}
                onMove={handleMove}
                onGameEnd={handleGameEnd}
              />
              
              {gameState.isSpectating && (
                <div className="mt-4 text-center">
                  <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg px-4 py-2 inline-block">
                    <span className="text-yellow-800 font-bold font-retro text-sm">
                      👀 SPECTATING MODE
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}