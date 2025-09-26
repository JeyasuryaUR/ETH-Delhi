import { Server, Socket } from 'socket.io';
import { Chess } from 'chess.js';

interface Player {
  id: string;
  name: string;
  walletAddress: string;
  socketId: string;
}

interface ChessGame {
  id: string;
  white: Player | null;
  black: Player | null;
  chess: Chess; // Chess.js instance for game logic
  turn: 'white' | 'black';
  status: 'waiting' | 'active' | 'completed';
  winner?: string;
  winReason?: string;
  createdAt: Date;
}

// In-memory storage for games (in production, use a proper database)
const activeGames: Map<string, ChessGame> = new Map();
const waitingQueue: Player[] = [];
const playerSockets: Map<string, Socket> = new Map();

export function initializeChessSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('🔌 Player connected:', socket.id);

    socket.on('join-game-queue', (playerData: Omit<Player, 'socketId'>) => {
      console.log('🎮 Player joining queue:', playerData);
      
      const player: Player = {
        ...playerData,
        socketId: socket.id
      };

      // Store socket reference
      playerSockets.set(socket.id, socket);
      
      // Check if there's someone waiting
      if (waitingQueue.length === 0) {
        // First player - add to queue
        waitingQueue.push(player);
        socket.emit('waiting-for-opponent');
        console.log('⏳ Player added to waiting queue');
      } else {
        // Second player - create game
        const opponent = waitingQueue.shift()!;
        const gameId = generateGameId();
        
        // Randomly assign colors
        const isWhite = Math.random() > 0.5;
        const whitePlayer = isWhite ? player : opponent;
        const blackPlayer = isWhite ? opponent : player;

        const game: ChessGame = {
          id: gameId,
          white: whitePlayer,
          black: blackPlayer,
          chess: new Chess(), // Initialize chess game
          turn: 'white',
          status: 'active',
          createdAt: new Date()
        };

        activeGames.set(gameId, game);

        // Join both players to game room
        socket.join(gameId);
        const opponentSocket = playerSockets.get(opponent.socketId);
        if (opponentSocket) {
          opponentSocket.join(gameId);
        }

        // Notify both players
        socket.emit('game-found', {
          gameId,
          playerColor: isWhite ? 'white' : 'black',
          opponent: opponent,
          board: game.chess.fen()
        });

        if (opponentSocket) {
          opponentSocket.emit('game-found', {
            gameId,
            playerColor: isWhite ? 'black' : 'white',
            opponent: player,
            board: game.chess.fen()
          });
        }

        console.log('🎯 Game created:', gameId, 'White:', whitePlayer.name, 'Black:', blackPlayer.name);
      }
    });

    socket.on('make-move', (data: { gameId: string; move: { from: string; to: string; promotion?: string } }) => {
      const { gameId, move } = data;
      const game = activeGames.get(gameId);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Verify it's the player's turn
      const isWhitePlayer = game.white?.socketId === socket.id;
      const isBlackPlayer = game.black?.socketId === socket.id;
      
      if (!isWhitePlayer && !isBlackPlayer) {
        socket.emit('error', { message: 'You are not in this game' });
        return;
      }

      const playerColor = isWhitePlayer ? 'white' : 'black';
      if (game.turn !== playerColor) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      try {
        // Validate and make the move using chess.js
        const chessMove = game.chess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined
        });

        if (!chessMove) {
          socket.emit('error', { message: 'Invalid move' });
          return;
        }

        console.log('📝 Valid move made:', chessMove.san, 'from player:', playerColor);

        // Switch turns
        game.turn = game.turn === 'white' ? 'black' : 'white';

        // Check for game end conditions
        let gameEnded = false;
        let winner = 'Draw';
        let winReason = '';

        if (game.chess.isGameOver()) {
          gameEnded = true;
          game.status = 'completed';

          if (game.chess.isCheckmate()) {
            winner = playerColor === 'white' ? game.white?.name || 'White' : game.black?.name || 'Black';
            winReason = 'Checkmate';
          } else if (game.chess.isStalemate()) {
            winReason = 'Stalemate';
          } else if (game.chess.isThreefoldRepetition()) {
            winReason = 'Threefold Repetition';
          } else if (game.chess.isInsufficientMaterial()) {
            winReason = 'Insufficient Material';
          } else if (game.chess.isDraw()) {
            winReason = 'Draw';
          }

          game.winner = winner;
          game.winReason = winReason;
        }

        // Broadcast move to both players
        io.to(gameId).emit('move-made', {
          move: chessMove,
          turn: game.turn,
          board: game.chess.fen(),
          moveHistory: game.chess.history(),
          check: game.chess.inCheck()
        });

        // If game ended, broadcast completion
        if (gameEnded) {
          io.to(gameId).emit('game-completed', {
            winner,
            reason: winReason,
            moveHistory: game.chess.history(),
            finalBoard: game.chess.fen()
          });

          console.log('🏆 Game completed:', gameId, 'Winner:', winner, 'Reason:', winReason);

          // Clean up after 5 minutes
          setTimeout(() => {
            activeGames.delete(gameId);
            console.log('🧹 Game cleaned up:', gameId);
          }, 5 * 60 * 1000);
        }

        console.log('📤 Move broadcasted to game:', gameId);

      } catch (error) {
        console.error('Error processing move:', error);
        socket.emit('error', { message: 'Invalid move format' });
      }
    });

    socket.on('game-ended', (data: { gameId: string; winner: string; reason: string }) => {
      const { gameId, winner, reason } = data;
      const game = activeGames.get(gameId);

      if (game) {
        game.status = 'completed';
        game.winner = winner;
        game.winReason = reason;

        // Broadcast game end to both players
        io.to(gameId).emit('game-completed', {
          winner,
          reason,
          moveHistory: game.chess.history(),
          finalBoard: game.chess.fen()
        });

        console.log('🏆 Game manually ended:', gameId, 'Winner:', winner, 'Reason:', reason);
        console.log('📋 Final move history:', game.chess.history());

        // Clean up after 5 minutes
        setTimeout(() => {
          activeGames.delete(gameId);
          console.log('🧹 Game cleaned up:', gameId);
        }, 5 * 60 * 1000);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Player disconnected:', socket.id);
      
      // Remove from waiting queue
      const queueIndex = waitingQueue.findIndex(player => player.socketId === socket.id);
      if (queueIndex !== -1) {
        waitingQueue.splice(queueIndex, 1);
        console.log('❌ Player removed from queue');
      }

      // Handle active games
      for (const [gameId, game] of activeGames.entries()) {
        if (game.white?.socketId === socket.id || game.black?.socketId === socket.id) {
          if (game.status === 'active') {
            // Notify opponent of disconnection
            socket.to(gameId).emit('opponent-disconnected');
            console.log('⚠️ Player disconnected from active game:', gameId);
          }
        }
      }

      // Clean up socket reference
      playerSockets.delete(socket.id);
    });
  });

  console.log('🚀 Chess socket handlers initialized');
}

function generateGameId(): string {
  return 'game_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Export for potential use in other modules
export { activeGames, waitingQueue };