'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/retroui/Button';
import { ChessBoard } from '@/components/chess/ChessBoard';
import { useChessSocket } from '@/hooks/useChessSocket';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { motion } from 'framer-motion';

interface Player {
  id: string;
  name: string;
  walletAddress: string;
}

interface GameState {
  status: 'waiting' | 'searching' | 'matched' | 'playing' | 'finished';
  player: Player | null;
  opponent: Player | null;
  gameId: string | null;
  board: string; // FEN notation
  turn: 'white' | 'black';
  playerColor: 'white' | 'black' | null;
  winner: string | null;
  winReason: string | null;
}

export default function ChessPage() {
  const router = useRouter();
  const { primaryWallet, user } = useDynamicContext();
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    player: null,
    opponent: null,
    gameId: null,
    board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
    turn: 'white',
    playerColor: null,
    winner: null,
    winReason: null
  });

  // Socket event handlers
  const handleWaitingForOpponent = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'searching' }));
  }, []);

  const handleGameFound = useCallback((data: { gameId: string; playerColor: 'white' | 'black'; opponent: Player; board: string }) => {
    setGameState(prev => ({
      ...prev,
      status: 'matched',
      gameId: data.gameId,
      playerColor: data.playerColor,
      opponent: data.opponent,
      board: data.board
    }));

    // Start playing after a brief delay
    setTimeout(() => {
      setGameState(current => ({ ...current, status: 'playing' }));
    }, 2000);
  }, []);

  const handleMoveMade = useCallback((data: { move: any; turn: 'white' | 'black'; board: string; moveHistory: string[]; check?: boolean }) => {
    // Update game state with the new move
    setGameState(prev => ({
      ...prev,
      turn: data.turn,
      board: data.board // Update board position
    }));

    console.log('📝 Move processed:', data.move.san, 'New position:', data.board);
    if (data.check) {
      console.log('⚠️ Check!');
    }
  }, []);

  const handleGameCompleted = useCallback((data: { winner: string; reason: string; moveHistory: string[]; finalBoard: string }) => {
    setGameState(prev => ({
      ...prev,
      status: 'finished',
      winner: data.winner,
      winReason: data.reason,
      board: data.finalBoard
    }));

    // Console log the game scoresheet as requested
    console.log('🏆 GAME COMPLETED 🏆');
    console.log('=====================================');
    console.log('Winner:', data.winner);
    console.log('Winning Reason:', data.reason);
    console.log('Player 1:', gameState.player?.name, '(', gameState.player?.walletAddress, ')');
    console.log('Player 2:', gameState.opponent?.name, '(', gameState.opponent?.walletAddress, ')');
    console.log('Game ID:', gameState.gameId);
    console.log('Final Board Position:', data.finalBoard);
    console.log('Move History:', data.moveHistory);
    console.log('=====================================');
  }, [gameState.player, gameState.opponent, gameState.gameId]);

  const handleOpponentDisconnected = useCallback(() => {
    console.log('⚠️ Opponent disconnected');
    setGameState(prev => ({
      ...prev,
      status: 'finished',
      winner: gameState.player?.name || 'You',
      winReason: 'Opponent disconnected'
    }));
  }, [gameState.player]);

  const handleError = useCallback((error: { message: string }) => {
    console.error('❌ Game error:', error);
  }, []);

  // Initialize socket
  const { isConnected, joinQueue, makeMove, endGame } = useChessSocket(
    handleWaitingForOpponent,
    handleGameFound,
    handleMoveMade,
    handleGameCompleted,
    handleOpponentDisconnected,
    handleError
  );

  // Get user data from connected Dynamic wallet
  useEffect(() => {
    if (primaryWallet && user) {
      // Use actual wallet data instead of hardcoded values
      // console.log("User:", user);
      setGameState(prev => ({
        ...prev,
        player: {
          id: user.userId || 'user_' + Math.random().toString(36).substring(7),
          name: user.firstName || user.email || 'Player 1',
          walletAddress: primaryWallet.address
        }
      }));
    }
  }, [primaryWallet, user]);

  const handleStartGame = async () => {
    if (gameState.player && isConnected) {
      joinQueue(gameState.player);
    } else {
      console.error('Cannot start game: player not set or not connected');
    }
  };

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (gameState.gameId) {
      makeMove(gameState.gameId, move);
    }
  };

  const handleGameEnd = (winner: string, reason: string, finalBoard: string, moveHistory: string[]) => {
    if (gameState.gameId) {
      endGame(gameState.gameId, winner, reason);
    }
  };

  const resetGame = () => {
    setGameState({
      status: 'waiting',
      player: gameState.player, // Keep player data
      opponent: null,
      gameId: null,
      board: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'white',
      playerColor: null,
      winner: null,
      winReason: null
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.back()}
          className="mb-6 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-sm transition-colors duration-200"
        >
          ← Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-gray-800 mb-2">Chess Arena</h1>
          <p className="text-gray-600">Challenge players worldwide in strategic chess battles</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Connected to game server' : 'Connecting...'}
            </span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Controls */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
            >
              <h2 className="text-xl font-bold mb-6">Game Controls</h2>
              
              {gameState.status === 'waiting' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Connected as:</p>
                    <p className="font-semibold">{gameState.player?.name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {gameState.player?.walletAddress?.substring(0, 10)}...
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleStartGame}
                    disabled={!isConnected || !gameState.player}
                    className="w-full"
                    size="lg"
                  >
                    {!isConnected ? 'Connecting...' : 'Start Game'}
                  </Button>
                  
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Coming Soon:</p>
                    <Button variant="outline" disabled className="w-full">
                      Challenge Specific Player
                    </Button>
                  </div>
                </div>
              )}

              {gameState.status === 'searching' && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-b-transparent"></div>
                      <h3 className="font-bold text-blue-800">Searching...</h3>
                    </div>
                    <p className="text-sm text-blue-600">Looking for an opponent</p>
                  </div>
                </div>
              )}

              {gameState.status === 'matched' && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <h3 className="font-bold text-green-800 mb-2">Match Found!</h3>
                    <p className="text-sm text-green-600">
                      Opponent: {gameState.opponent?.name}
                    </p>
                    <p className="text-xs text-green-500 font-mono">
                      {gameState.opponent?.walletAddress?.substring(0, 10)}...
                    </p>
                    <div className="mt-3">
                      <div className="animate-pulse text-green-600">
                        Starting game...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {gameState.status === 'playing' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-2">Game in Progress</h3>
                    <p className="text-sm text-blue-600 mb-2">
                      You are playing as: <span className="font-bold capitalize">{gameState.playerColor}</span>
                    </p>
                    <p className="text-sm text-blue-600">
                      Turn: <span className="font-bold capitalize">{gameState.turn}</span>
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Opponent:</p>
                    <p className="font-semibold">{gameState.opponent?.name}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {gameState.opponent?.walletAddress?.substring(0, 10)}...
                    </p>
                  </div>
                </div>
              )}

              {gameState.status === 'finished' && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <h3 className="font-bold text-yellow-800 mb-2">Game Finished!</h3>
                    <p className="text-sm text-yellow-600 mb-1">
                      Winner: <span className="font-bold">{gameState.winner}</span>
                    </p>
                    <p className="text-sm text-yellow-600">
                      Reason: {gameState.winReason}
                    </p>
                  </div>
                  
                  <Button onClick={resetGame} className="w-full" size="lg">
                    Play Again
                  </Button>
                </div>
              )}
            </motion.div>
          </div>

          {/* Chess Board */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
            >
              {gameState.status === 'playing' ? (
                <ChessBoard
                  position={gameState.board}
                  playerColor={gameState.playerColor}
                  onMove={handleMove}
                  onGameEnd={handleGameEnd}
                />
              ) : (
                <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">♚</div>
                    <h3 className="text-xl font-bold text-amber-800 mb-2">
                      {gameState.status === 'waiting' && 'Ready to Play'}
                      {gameState.status === 'searching' && 'Finding Opponent'}
                      {gameState.status === 'matched' && 'Preparing Board'}
                      {gameState.status === 'finished' && 'Game Complete'}
                    </h3>
                    <p className="text-amber-600">
                      {gameState.status === 'waiting' && 'Click "Start Game" to begin'}
                      {gameState.status === 'searching' && 'Searching for an opponent...'}
                      {gameState.status === 'matched' && 'Match found! Starting soon...'}
                      {gameState.status === 'finished' && 'Check console for game results'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
