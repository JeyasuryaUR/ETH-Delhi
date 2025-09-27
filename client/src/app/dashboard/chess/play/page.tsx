'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/retroui/Button';
import { ChessBoard } from '@/components/chess/ChessBoard';
import { useChessSocket } from '@/hooks/useChessSocket';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { motion, AnimatePresence } from 'framer-motion';

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

interface GameResult {
  show: boolean;
  type: 'win' | 'lose' | null;
  message: string;
  reason: string;
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

  const [gameResult, setGameResult] = useState<GameResult>({
    show: false,
    type: null,
    message: '',
    reason: ''
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

    // Determine if player won or lost
    const playerWon = data.winner === gameState.player?.name || data.winner === 'You';
    
    // Show appropriate popup
    setGameResult({
      show: true,
      type: playerWon ? 'win' : 'lose',
      message: playerWon ? '🎉 HURRAY! CONGRATULATIONS! 🎉' : '😔 OOPS! BETTER LUCK NEXT TIME! 😔',
      reason: data.reason
    });

    // Auto-hide popup after 5 seconds
    setTimeout(() => {
      setGameResult(prev => ({ ...prev, show: false }));
    }, 5000);

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

    // Show win popup for opponent disconnection
    setGameResult({
      show: true,
      type: 'win',
      message: '🎉 VICTORY BY FORFEIT! 🎉',
      reason: 'Opponent disconnected'
    });

    // Auto-hide popup after 5 seconds
    setTimeout(() => {
      setGameResult(prev => ({ ...prev, show: false }));
    }, 5000);
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
    setGameResult({ show: false, type: null, message: '', reason: '' });
  };

  const closePopup = () => {
    setGameResult(prev => ({ ...prev, show: false }));
  };

  return (
    <div className="bg-background h-screen overflow-hidden">
      <div className="relative h-screen flex px-4 lg:px-8 bg-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto w-full h-full flex flex-col pt-24">
          {/* Header */}
          <div className="flex-shrink-0 mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.back()}
              className="px-4 py-2 retro-border retro-shadow bg-card hover:bg-card/90 text-card-foreground font-retro text-xs uppercase tracking-wider"
            >
              ← Back
            </motion.button>
          </div>

          <div className="grid lg:grid-cols-12 gap-4 flex-1 min-h-0">
            {/* Left Side - Header Info and Game Controls */}
            <div className="lg:col-span-3 space-y-3 overflow-y-auto">
              {/* Header Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card retro-border retro-shadow p-4"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground retro-border flex items-center justify-center">
                    <span className="text-sm">⚔️</span>
                  </div>
                  <div>
                    <h1 className="text-lg font-black font-heading text-foreground uppercase">Chess Arena</h1>
                    <p className="text-xs text-muted-foreground font-medium">Challenge players worldwide</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full retro-border ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs font-retro text-card-foreground uppercase">
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </motion.div>

              {/* Game Controls */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card retro-border retro-shadow p-4"
              >
                <h2 className="text-lg font-black font-heading text-foreground uppercase mb-4">Game Controls</h2>

                {gameState.status === 'waiting' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted retro-border rounded-lg">
                      <p className="text-xs font-retro text-muted-foreground uppercase mb-1">Connected as:</p>
                      <p className="font-black text-foreground text-sm">{gameState.player?.name}</p>
                      <p className="text-xs font-retro text-muted-foreground font-mono">
                        {gameState.player?.walletAddress?.substring(0, 8)}...
                      </p>
                    </div>

                    <Button
                      onClick={handleStartGame}
                      disabled={!isConnected || !gameState.player}
                      className="w-full font-retro uppercase text-sm py-2"
                      size="sm"
                    >
                      {!isConnected ? 'Connecting...' : 'Start Game'}
                    </Button>

                    <div className="text-center pt-2 border-t retro-border">
                      <p className="text-xs font-retro text-muted-foreground uppercase mb-2">Coming Soon:</p>
                      <Button variant="secondary" disabled className="w-full font-retro uppercase text-xs py-1" size="sm">
                        Challenge Player
                      </Button>
                    </div>
                  </div>
                )}

                {gameState.status === 'searching' && (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-primary text-primary-foreground retro-border retro-shadow">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-b-transparent"></div>
                        <h3 className="font-black font-heading uppercase text-sm">Searching...</h3>
                      </div>
                      <p className="text-xs font-retro uppercase">Looking for opponent</p>
                    </div>
                  </div>
                )}

                {gameState.status === 'matched' && (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-green-500 text-white retro-border retro-shadow">
                      <h3 className="font-black font-heading uppercase mb-2 text-sm">Match Found!</h3>
                      <p className="text-xs font-retro mb-1">
                        Opponent: {gameState.opponent?.name}
                      </p>
                      <p className="text-xs font-retro font-mono mb-2">
                        {gameState.opponent?.walletAddress?.substring(0, 8)}...
                      </p>
                      <div className="animate-pulse font-black font-heading uppercase text-xs">
                        Starting...
                      </div>
                    </div>
                  </div>
                )}

                {gameState.status === 'playing' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-accent text-accent-foreground retro-border retro-shadow">
                      <h3 className="font-black font-heading uppercase mb-2 text-sm">Game in Progress</h3>
                      <p className="text-xs font-retro mb-1">
                        Playing as: <span className="font-black uppercase text-primary">{gameState.playerColor}</span>
                      </p>
                      <p className="text-xs font-retro">
                        Turn: <span className={`font-black uppercase ${gameState.turn === gameState.playerColor ? 'text-green-500' : 'text-red-500'}`}>{gameState.turn}</span>
                      </p>
                    </div>

                    <div className="p-3 bg-muted retro-border rounded-lg">
                      <p className="text-xs font-retro text-muted-foreground uppercase mb-1">Opponent:</p>
                      <p className="font-black text-foreground text-sm mb-1">{gameState.opponent?.name}</p>
                      <p className="text-xs font-retro text-muted-foreground font-mono">
                        {gameState.opponent?.walletAddress?.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                )}

                {gameState.status === 'finished' && (
                  <div className="space-y-3">
                    <div className="p-4 bg-primary text-primary-foreground retro-border retro-shadow">
                      <h3 className="font-black font-heading uppercase mb-2 text-sm">Game Finished!</h3>
                      <p className="text-xs font-retro mb-1">
                        Winner: <span className="font-black uppercase text-green-300">{gameState.winner}</span>
                      </p>
                      <p className="text-xs font-retro">
                        Reason: {gameState.winReason}
                      </p>
                    </div>

                    <Button onClick={resetGame} className="w-full font-retro uppercase text-sm py-2" size="sm">
                      Play Again
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Side - Chess Board */}
            <div className="lg:col-span-9 flex items-center justify-center p-4 min-h-0">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full h-full flex items-center justify-center"
              >
                {gameState.status === 'playing' ? (
                  <div 
                    className="aspect-square w-full mx-auto" 
                    style={{ 
                      maxWidth: 'min(80vh, 80vw)',
                      width: '100%'
                    }}
                  >
                    <ChessBoard
                      position={gameState.board}
                      playerColor={gameState.playerColor}
                      onMove={handleMove}
                      onGameEnd={handleGameEnd}
                    />
                  </div>
                ) : (
                  <div 
                    className="aspect-square bg-card retro-border-thick retro-shadow-lg flex items-center justify-center mx-auto"
                    style={{ 
                      maxWidth: 'min(80vh, 80vw)',
                      width: '100%'
                    }}
                  >
                    <div className="text-center p-8">
                      <div className="text-6xl mb-6 text-primary">♚</div>
                      <h3 className="text-2xl font-black font-heading text-foreground uppercase mb-4">
                        {gameState.status === 'waiting' && 'Ready to Play'}
                        {gameState.status === 'searching' && 'Finding Opponent'}
                        {gameState.status === 'matched' && 'Preparing Board'}
                        {gameState.status === 'finished' && 'Game Complete'}
                      </h3>
                      <p className="text-sm font-retro text-muted-foreground">
                        {gameState.status === 'waiting' && 'Click "Start Game" to begin your chess journey'}
                        {gameState.status === 'searching' && 'Searching for a worthy opponent...'}
                        {gameState.status === 'matched' && 'Match found! Get ready to play...'}
                        {gameState.status === 'finished' && 'Check console for detailed game results'}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Result Popup */}
      <AnimatePresence>
        {gameResult.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={closePopup}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }
              }}
              exit={{ 
                scale: 0.8, 
                opacity: 0,
                transition: {
                  duration: 0.3
                }
              }}
              className="relative bg-gray-800 border-4 border-gray-600 rounded-lg retro-shadow-lg text-center max-w-lg mx-4 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closePopup}
                className="absolute top-3 right-3 w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
              >
                ×
              </button>

              {/* Trophy/Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: 1,
                  rotate: 0
                }}
                transition={{ 
                  delay: 0.2,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 200
                }}
                className="text-6xl mb-6"
              >
                {gameResult.type === 'win' ? '🏆' : '💀'}
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-4xl font-black text-white uppercase mb-4 tracking-wider"
              >
                {gameResult.type === 'win' ? 'VICTORY!' : 'DEFEAT!'}
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-white text-lg mb-8 leading-relaxed"
              >
                {gameResult.type === 'win' 
                  ? 'Congratulations! You have successfully completed the game. Your strategic moves led to a brilliant victory!'
                  : 'Better luck next time! Your opponent outplayed you this round. Learn from this defeat and come back stronger!'
                }
              </motion.p>

              {/* Action button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex justify-center"
              >
                <button
                  onClick={resetGame}
                  className="bg-black text-white px-8 py-4 border-4 border-white font-black uppercase text-lg tracking-wider hover:bg-gray-900 transition-colors duration-200 retro-shadow"
                >
                  {gameResult.type === 'win' ? 'EXCELLENT!' : 'TRY AGAIN!'}
                </button>
              </motion.div>

              {/* Particle effects */}
              {gameResult.type === 'win' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        x: '50%', 
                        y: '50%', 
                        scale: 0,
                        rotate: 0
                      }}
                      animate={{ 
                        x: `${50 + (Math.random() - 0.5) * 300}%`, 
                        y: `${50 + (Math.random() - 0.5) * 300}%`,
                        scale: [0, 1, 0],
                        rotate: 360
                      }}
                      transition={{ 
                        delay: 1 + i * 0.1,
                        duration: 2.5,
                        ease: "easeOut"
                      }}
                      className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Defeat effect */}
              {gameResult.type === 'lose' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        x: '50%', 
                        y: '50%', 
                        scale: 0,
                        rotate: 0
                      }}
                      animate={{ 
                        x: `${50 + (Math.random() - 0.5) * 200}%`, 
                        y: `${50 + (Math.random() - 0.5) * 200}%`,
                        scale: [0, 1, 0],
                        rotate: 180
                      }}
                      transition={{ 
                        delay: 1 + i * 0.2,
                        duration: 2,
                        ease: "easeOut"
                      }}
                      className="absolute w-2 h-2 bg-red-500 rounded-full"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}