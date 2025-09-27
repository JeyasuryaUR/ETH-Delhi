import { Server, Socket } from 'socket.io';
import { Chess } from 'chess.js';
import { prisma } from '../lib/prisma';

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
  savedToDatabase?: boolean; // Flag to prevent duplicate saves
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

    // Tournament game joining
    socket.on('join-tournament-game', async (data: { gameId: string; player: Omit<Player, 'socketId'> }) => {
      console.log('🏆 Player joining tournament game:', data.gameId, data.player);
      
      const { gameId, player: playerData } = data;
      const player: Player = {
        ...playerData,
        socketId: socket.id
      };

      // Store socket reference
      playerSockets.set(socket.id, socket);
      
      try {
        // Fetch tournament game data from database to get correct color assignments
        const tournamentGame = await prisma.games.findUnique({
          where: { id: gameId },
          include: {
            white: {
              select: {
                id: true,
                username: true,
                wallet_address: true
              }
            },
            black: {
              select: {
                id: true,
                username: true,
                wallet_address: true
              }
            }
          }
        });

        if (!tournamentGame) {
          socket.emit('error', { message: 'Tournament game not found' });
          return;
        }

        if (!tournamentGame.white || !tournamentGame.black) {
          socket.emit('error', { message: 'Tournament game players not properly assigned' });
          return;
        }

        if (!tournamentGame.white.wallet_address || !tournamentGame.black.wallet_address) {
          socket.emit('error', { message: 'Player wallet addresses not found' });
          return;
        }

        // Check if game already exists in activeGames
        let game = activeGames.get(gameId);
        
        if (!game) {
          // Create new game for tournament with proper initialization
          game = {
            id: gameId,
            white: null,
            black: null,
            chess: new Chess(),
            turn: 'white',
            status: 'waiting',
            createdAt: new Date()
          };
          activeGames.set(gameId, game);
        }

        // Join player to game room
        socket.join(gameId);

        // Assign player based on tournament game data (wallet address comparison)
        const playerWalletAddress = player.walletAddress.toLowerCase();
        const whiteWalletAddress = tournamentGame.white.wallet_address.toLowerCase();
        const blackWalletAddress = tournamentGame.black.wallet_address.toLowerCase();

        if (playerWalletAddress === whiteWalletAddress) {
          game.white = player;
          console.log('🤍 White player connected:', player.name, player.walletAddress);
        } else if (playerWalletAddress === blackWalletAddress) {
          game.black = player;
          console.log('� Black player connected:', player.name, player.walletAddress);
        } else {
          socket.emit('error', { message: 'You are not a player in this tournament game' });
          return;
        }

        // Check if both players are connected
        if (game.white && game.black) {
          game.status = 'active';
          
          // Notify both players that the game is ready
          const whiteSocket = playerSockets.get(game.white.socketId);
          const blackSocket = playerSockets.get(game.black.socketId);

          if (whiteSocket) {
            whiteSocket.emit('tournament-game-ready', {
              gameId,
              playerColor: 'white',
              opponent: game.black,
              board: game.chess.fen(),
              turn: game.turn
            });
          }

          if (blackSocket) {
            blackSocket.emit('tournament-game-ready', {
              gameId,
              playerColor: 'black',
              opponent: game.white,
              board: game.chess.fen(),
              turn: game.turn
            });
          }

          console.log('🎯 Tournament game ready:', gameId, 'White:', game.white.name, 'Black:', game.black.name);
        } else {
          // Still waiting for the other player
          socket.emit('waiting-for-opponent');
          console.log('⏳ Tournament game waiting for other player:', gameId);
        }
        
      } catch (error) {
        console.error('Error joining tournament game:', error);
        socket.emit('error', { message: 'Failed to join tournament game' });
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
        let result = 'Draw';

        if (game.chess.isGameOver()) {
          gameEnded = true;
          game.status = 'completed';

          if (game.chess.isCheckmate()) {
            winner = playerColor === 'white' ? game.white?.name || 'White' : game.black?.name || 'Black';
            winReason = 'Checkmate';
            result = playerColor === 'white' ? `White won - ${game.white?.walletAddress}` : `Black won - ${game.black?.walletAddress}`;
          } else if (game.chess.isStalemate()) {
            winReason = 'Stalemate';
            result = 'Draw - Stalemate';
          } else if (game.chess.isThreefoldRepetition()) {
            winReason = 'Threefold Repetition';
            result = 'Draw - Threefold Repetition';
          } else if (game.chess.isInsufficientMaterial()) {
            winReason = 'Insufficient Material';
            result = 'Draw - Insufficient Material';
          } else if (game.chess.isDraw()) {
            winReason = 'Draw';
            result = 'Draw';
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

        // If game ended, save to database and broadcast completion
        if (gameEnded && !game.savedToDatabase) {
          // Save game to database (only if not already saved)
          game.savedToDatabase = true;
          saveGameToDatabase(game, result, winReason);

          io.to(gameId).emit('game-completed', {
            winner,
            reason: winReason,
            result: result,
            moveHistory: game.chess.history(),
            finalBoard: game.chess.fen()
          });

          console.log('🏆 Game completed:', gameId, 'Winner:', winner, 'Reason:', winReason, 'Result:', result);

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

        // Determine result string
        let result = 'Draw';
        if (winner === game.white?.name || winner === 'White') {
          result = `White won - ${game.white?.walletAddress}`;
        } else if (winner === game.black?.name || winner === 'Black') {
          result = `Black won - ${game.black?.walletAddress}`;
        } else {
          result = `Draw - ${reason}`;
        }

        // Save game to database (only if not already saved)
        if (!game.savedToDatabase) {
          game.savedToDatabase = true;
          saveGameToDatabase(game, result, reason);
        }

        // Broadcast game end to both players
        io.to(gameId).emit('game-completed', {
          winner,
          reason,
          result,
          moveHistory: game.chess.history(),
          finalBoard: game.chess.fen()
        });

        console.log('🏆 Game manually ended:', gameId, 'Winner:', winner, 'Reason:', reason, 'Result:', result);
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

// Function to save game to database
async function saveGameToDatabase(game: ChessGame, result: string, winReason: string) {
  try {
    // Find users by wallet address
    const whiteUser = game.white ? await prisma.users.findUnique({
      where: { wallet_address: game.white.walletAddress.toLowerCase() }
    }) : null;

    const blackUser = game.black ? await prisma.users.findUnique({
      where: { wallet_address: game.black.walletAddress.toLowerCase() }
    }) : null;

    if (!whiteUser || !blackUser) {
      console.error('❌ Could not find users in database for game:', game);
      console.log('📋 Game details:');
      console.error('Game ID:', game.id);
      console.error('White user:', game.white?.walletAddress || "");
      console.error('Black user:', game.black?.walletAddress || "");
      return null;
    }

    // Determine winner
    let winnerId = null;
    if (result.includes('White won')) {
      winnerId = whiteUser.id;
    } else if (result.includes('Black won')) {
      winnerId = blackUser.id;
    }

    // Create game record
    const savedGame = await prisma.games.create({
      data: {
        white_id: whiteUser.id,
        black_id: blackUser.id,
        winner_id: winnerId,
        result: result,
        termination: winReason,
        move_count: game.chess.history().length,
        pgn: game.chess.pgn(),
        moves: game.chess.history({ verbose: true }) as any,
        rated: true,
        variant: 'standard',
        initial_fen: 'startpos',
        started_at: game.createdAt,
        ended_at: new Date(),
        metadata: {
          gameId: game.id,
          whitePlayer: {
            name: game.white?.name,
            walletAddress: game.white?.walletAddress
          },
          blackPlayer: {
            name: game.black?.name,
            walletAddress: game.black?.walletAddress
          }
        }
      }
    });

    console.log('✅ Game saved to database:', savedGame.id, 'Result:', result);
    return savedGame;
  } catch (error) {
    console.error('❌ Error saving game to database:', error);
    return null;
  }
}

// Export for potential use in other modules
export { activeGames, waitingQueue };