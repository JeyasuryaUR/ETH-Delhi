'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  name: string;
  walletAddress: string;
}

interface GameFoundData {
  gameId: string;
  playerColor: 'white' | 'black';
  opponent: Player;
  board: string;
}

interface MoveData {
  move: any; // Chess.js move object
  turn: 'white' | 'black';
  board: string; // FEN notation
  moveHistory: string[];
  check?: boolean;
}

interface GameCompletedData {
  winner: string;
  reason: string;
  moveHistory: string[];
  finalBoard: string;
}

interface UseChessSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinQueue: (player: Player) => void;
  joinTournamentGame: (gameId: string, player: Player) => void;
  makeMove: (gameId: string, move: { from: string; to: string; promotion?: string }) => void;
  endGame: (gameId: string, winner: string, reason: string) => void;
}

export function useChessSocket(
  onWaitingForOpponent?: () => void,
  onGameFound?: (data: GameFoundData) => void,
  onMoveMade?: (data: MoveData) => void,
  onGameCompleted?: (data: GameCompletedData) => void,
  onOpponentDisconnected?: () => void,
  onError?: (error: { message: string }) => void
): UseChessSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Use refs to store the latest callback functions
  const callbacksRef = useRef({
    onWaitingForOpponent,
    onGameFound,
    onMoveMade,
    onGameCompleted,
    onOpponentDisconnected,
    onError
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onWaitingForOpponent,
      onGameFound,
      onMoveMade,
      onGameCompleted,
      onOpponentDisconnected,
      onError
    };
  });

  useEffect(() => {
    // Only run once on mount
    const newSocket = io('http://localhost:8000', {
      forceNew: true,
      transports: ['websocket']
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('🔌 Connected to chess server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from chess server');
      setIsConnected(false);
    });

    newSocket.on('waiting-for-opponent', () => {
      console.log('⏳ Waiting for opponent...');
      callbacksRef.current.onWaitingForOpponent?.();
    });

    newSocket.on('game-found', (data: GameFoundData) => {
      console.log('🎯 Game found!', data);
      callbacksRef.current.onGameFound?.(data);
    });

    newSocket.on('tournament-game-ready', (data: GameFoundData) => {
      console.log('🏆 Tournament game ready!', data);
      callbacksRef.current.onGameFound?.(data);
    });

    newSocket.on('move-made', (data: MoveData) => {
      console.log('📝 Move received:', data);
      callbacksRef.current.onMoveMade?.(data);
    });

    newSocket.on('game-completed', (data: GameCompletedData) => {
      console.log('🏆 Game completed:', data);
      callbacksRef.current.onGameCompleted?.(data);
    });

    newSocket.on('opponent-disconnected', () => {
      console.log('⚠️ Opponent disconnected');
      callbacksRef.current.onOpponentDisconnected?.();
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('❌ Socket error:', error);
      callbacksRef.current.onError?.(error);
    });

    // Cleanup only on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty dependency array - only run once

  const joinQueue = useCallback((player: Player) => {
    if (socketRef.current && isConnected) {
      console.log('🎮 Joining game queue:', player);
      socketRef.current.emit('join-game-queue', player);
    } else {
      console.warn('❌ Cannot join queue: socket not connected');
    }
  }, [isConnected]);

  const joinTournamentGame = useCallback((gameId: string, player: Player) => {
    if (socketRef.current && isConnected) {
      console.log('🏆 Joining tournament game:', gameId, player);
      socketRef.current.emit('join-tournament-game', { gameId, player });
    } else {
      console.warn('❌ Cannot join tournament game: socket not connected');
    }
  }, [isConnected]);

  const makeMove = useCallback((gameId: string, move: { from: string; to: string; promotion?: string }) => {
    if (socketRef.current && isConnected) {
      console.log('📝 Making move:', move, 'in game:', gameId);
      socketRef.current.emit('make-move', { gameId, move });
    } else {
      console.warn('❌ Cannot make move: socket not connected');
    }
  }, [isConnected]);

  const endGame = useCallback((gameId: string, winner: string, reason: string) => {
    if (socketRef.current && isConnected) {
      console.log('🏆 Ending game:', gameId, 'Winner:', winner, 'Reason:', reason);
      socketRef.current.emit('game-ended', { gameId, winner, reason });
    } else {
      console.warn('❌ Cannot end game: socket not connected');
    }
  }, [isConnected]);

  return {
    socket,
    isConnected,
    joinQueue,
    joinTournamentGame,
    makeMove,
    endGame
  };
}