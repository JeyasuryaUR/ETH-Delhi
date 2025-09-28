'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/retroui/Button';
import { ChessBoard } from '@/components/chess/ChessBoard';
import { useChessSocket } from '@/hooks/useChessSocket';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { motion } from 'framer-motion';

// Disable prerendering for this client-side page
export const dynamic = 'force-dynamic';

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

  const [isClient, setIsClient] = useState(false);
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

  // Initialize client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-bold text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

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
    <div className="">
      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.back()}
            className="mb-6 px-4 py-2 border-2 border-black rounded-lg bg-white hover:bg-gray-100 text-black font-bold uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            ← Back to Chess Dashboard
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-[#FFE81E] border-2 border-black rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚔️</span>
              </div>
              <div>
                <h1 className="text-4xl font-black text-black uppercase">Chess Arena</h1>
                <p className="text-black font-bold">Challenge players worldwide in strategic chess battles</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className={`w-3 h-3 rounded-full border-2 border-black ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-bold text-black uppercase">
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
                <h2 className="text-xl font-black text-black uppercase mb-6">Game Controls</h2>

                {gameState.status === 'waiting' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-black rounded-lg">
                      <p className="text-sm font-bold text-black uppercase mb-2">Connected as:</p>
                      <p className="font-black text-black">{gameState.player?.name}</p>
                      <p className="text-xs font-bold text-black font-mono">
                        {gameState.player?.walletAddress?.substring(0, 10)}...
                      </p>
                    </div>

                    <Button
                      onClick={handleStartGame}
                      disabled={!isConnected || !gameState.player}
                      className="w-full font-bold uppercase"
                      size="lg"
                    >
                      {!isConnected ? 'Connecting...' : 'Start Game'}
                    </Button>

                    <div className="text-center pt-4 border-t-2 border-black">
                      <p className="text-sm font-bold text-black uppercase mb-2">Coming Soon:</p>
                      <Button variant="outline" disabled className="w-full font-bold uppercase">
                        Challenge Specific Player
                      </Button>
                    </div>
                  </div>
                )}

                {gameState.status === 'searching' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-[#FFE81E] rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-b-transparent"></div>
                        <h3 className="font-black text-black uppercase">Searching...</h3>
                      </div>
                      <p className="text-sm font-bold text-black uppercase">Looking for an opponent</p>
                    </div>
                  </div>
                )}

                {gameState.status === 'matched' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-400 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="font-black text-black uppercase mb-2">Match Found!</h3>
                      <p className="text-sm font-bold text-black">
                        Opponent: {gameState.opponent?.name}
                      </p>
                      <p className="text-xs font-bold text-black font-mono">
                        {gameState.opponent?.walletAddress?.substring(0, 10)}...
                      </p>
                      <div className="mt-3">
                        <div className="animate-pulse font-black text-black uppercase">
                          Starting game...
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {gameState.status === 'playing' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="font-black text-black uppercase mb-2">Game in Progress</h3>
                      <p className="text-sm font-bold text-black mb-2">
                        You are playing as: <span className="font-black uppercase">{gameState.playerColor}</span>
                      </p>
                      <p className="text-sm font-bold text-black">
                        Turn: <span className="font-black uppercase">{gameState.turn}</span>
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 border border-black rounded-lg">
                      <p className="text-sm font-bold text-black uppercase mb-1">Opponent:</p>
                      <p className="font-black text-black">{gameState.opponent?.name}</p>
                      <p className="text-xs font-bold text-black font-mono">
                        {gameState.opponent?.walletAddress?.substring(0, 10)}...
                      </p>
                    </div>
                  </div>
                )}

                {gameState.status === 'finished' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#FFE81E] rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="font-black text-black uppercase mb-2">Game Finished!</h3>
                      <p className="text-sm font-bold text-black mb-1">
                        Winner: <span className="font-black uppercase">{gameState.winner}</span>
                      </p>
                      <p className="text-sm font-bold text-black">
                        Reason: {gameState.winReason}
                      </p>
                    </div>

                    <Button onClick={resetGame} className="w-full font-bold uppercase" size="lg">
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
                  <div className="aspect-square bg-[#FFE81E] border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-center">
                      <div className="text-6xl mb-4">♚</div>
                      <h3 className="text-xl font-black text-black uppercase mb-2">
                        {gameState.status === 'waiting' && 'Ready to Play'}
                        {gameState.status === 'searching' && 'Finding Opponent'}
                        {gameState.status === 'matched' && 'Preparing Board'}
                        {gameState.status === 'finished' && 'Game Complete'}
                      </h3>
                      <p className="font-bold text-black">
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
    </div>
  );

}