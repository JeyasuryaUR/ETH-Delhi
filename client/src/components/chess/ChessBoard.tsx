'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';

interface ChessBoardProps {
  position?: string; // FEN notation
  playerColor: 'white' | 'black' | null;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  onGameEnd: (winner: string, reason: string, finalBoard: string, moveHistory: string[]) => void;
}

interface PieceInfo {
  type: string;
  color: 'w' | 'b';
}

const pieceSymbols: { [key: string]: string } = {
  'wp': '♙', 'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔',
  'bp': '♟', 'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚'
};

export function ChessBoard({ position, playerColor, onMove, onGameEnd }: ChessBoardProps) {
  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [lastMoveFromServer, setLastMoveFromServer] = useState<{ from: Square; to: Square } | null>(null);

  // Initialize game with position and update when position changes
  useEffect(() => {
    if (position) {
      console.log('🔄 Updating chess board with new position:', position);
      const newGame = new Chess(position);
      setGame(newGame);
      setMoveHistory(newGame.history());
      
      // Clear selection when position updates from server
      setSelectedSquare(null);
      setValidMoves([]);
      
      // Update last move highlighting if we have move history
      const history = newGame.history({ verbose: true });
      if (history.length > 0) {
        const lastMove = history[history.length - 1];
        setLastMoveFromServer({ from: lastMove.from, to: lastMove.to });
        setLastMove({ from: lastMove.from, to: lastMove.to });
      }
    }
  }, [position]);

  // Note: Game end detection is now handled server-side only to prevent duplicates
  // The server will emit 'game-completed' when a game ends
  // This prevents race conditions and duplicate database saves

  const getSquareColor = (row: number, col: number): string => {
    const isLight = (row + col) % 2 === 0;
    
    // Calculate the square name for checking selection and last move
    const file = String.fromCharCode(97 + col); // 'a' to 'h'
    const rank = playerColor === 'black' ? row + 1 : 8 - row;
    const square = `${file}${rank}` as Square;
    
    // Highlight selected square
    if (selectedSquare === square) {
      return 'bg-yellow-400';
    }
    
    // Highlight last move
    if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      return isLight ? 'bg-yellow-200' : 'bg-yellow-300';
    }
    
    // Highlight valid moves
    if (validMoves.includes(square)) {
      return isLight ? 'bg-green-200' : 'bg-green-300';
    }
    
    // Default colors
    return isLight ? 'bg-amber-100' : 'bg-amber-800';
  };

  const getPiece = (row: number, col: number): PieceInfo | null => {
    const file = String.fromCharCode(97 + col);
    const rank = playerColor === 'black' ? row + 1 : 8 - row;
    const square = `${file}${rank}` as Square;
    
    const piece = game.get(square);
    return piece || null;
  };

  const handleSquareClick = useCallback((row: number, col: number) => {
    const file = String.fromCharCode(97 + col);
    const rank = playerColor === 'black' ? row + 1 : 8 - row;
    const square = `${file}${rank}` as Square;

    // If it's not the player's turn, ignore the click
    const currentTurn = game.turn();
    if ((playerColor === 'white' && currentTurn !== 'w') || 
        (playerColor === 'black' && currentTurn !== 'b')) {
      return;
    }

    if (selectedSquare === null) {
      // Select a piece
      const piece = game.get(square);
      if (piece && piece.color === (playerColor === 'white' ? 'w' : 'b')) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map((move: Move) => move.to));
      }
    } else {
      // Try to make a move
      if (selectedSquare === square) {
        // Deselect if clicking the same square
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // Try to make a move - just send to server for validation
        try {
          // Check if it's a pawn promotion
          const piece = game.get(selectedSquare);
          const isPromotion = piece?.type === 'p' && 
                             ((piece.color === 'w' && square[1] === '8') || 
                              (piece.color === 'b' && square[1] === '1'));

          let promotion: 'q' | 'r' | 'b' | 'n' | undefined = undefined;
          if (isPromotion) {
            // Default to queen for simplicity - you could add a UI for this
            promotion = 'q';
          }

          // Test the move locally first to validate
          const tempGame = new Chess(game.fen());
          const testMove = tempGame.move({
            from: selectedSquare,
            to: square,
            promotion
          });

          if (testMove) {
            // Valid move - send to server, don't update local state
            console.log('📤 Sending move to server:', { from: selectedSquare, to: square, promotion });
            
            // Clear selection immediately
            setSelectedSquare(null);
            setValidMoves([]);
            
            // Notify parent component to send to server
            onMove({
              from: selectedSquare,
              to: square,
              promotion: promotion || undefined
            });
          } else {
            // Invalid move, try to select new piece
            const newPiece = game.get(square);
            if (newPiece && newPiece.color === (playerColor === 'white' ? 'w' : 'b')) {
              setSelectedSquare(square);
              const moves = game.moves({ square, verbose: true });
              setValidMoves(moves.map((move: Move) => move.to));
            } else {
              setSelectedSquare(null);
              setValidMoves([]);
            }
          }
        } catch (error) {
          // Invalid move, try to select new piece
          const newPiece = game.get(square);
          if (newPiece && newPiece.color === (playerColor === 'white' ? 'w' : 'b')) {
            setSelectedSquare(square);
            const moves = game.moves({ square, verbose: true });
            setValidMoves(moves.map((move: Move) => move.to));
          } else {
            setSelectedSquare(null);
            setValidMoves([]);
          }
        }
      }
    }
  }, [game, selectedSquare, playerColor, onMove]);

  const renderSquare = (row: number, col: number) => {
    const piece = getPiece(row, col);
    const file = String.fromCharCode(97 + col);
    const rank = playerColor === 'black' ? row + 1 : 8 - row;

    return (
      <div
        key={`${row}-${col}`}
        className={`
          aspect-square flex items-center justify-center cursor-pointer text-4xl
          transition-colors duration-150 hover:opacity-80 relative
          ${getSquareColor(row, col)}
        `}
        onClick={() => handleSquareClick(row, col)}
      >
        {/* Coordinates */}
        {col === 0 && (
          <div className="absolute left-1 top-1 text-xs font-semibold opacity-70">
            {rank}
          </div>
        )}
        {row === 7 && (
          <div className="absolute right-1 bottom-1 text-xs font-semibold opacity-70">
            {file}
          </div>
        )}

        {/* Piece */}
        {piece && (
          <span className="select-none drop-shadow-sm">
            {pieceSymbols[`${piece.color}${piece.type}`]}
          </span>
        )}

        {/* Valid move indicator */}
        {validMoves.includes(`${file}${rank}` as Square) && !piece && (
          <div className="w-3 h-3 bg-green-600 rounded-full opacity-60"></div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* Chess Board */}
      <div className="grid grid-cols-8 border-4 border-gray-800 rounded-lg overflow-hidden shadow-xl bg-white">
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 8 }, (_, col) => renderSquare(row, col))
        )}
      </div>

      {/* Game Info */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div>
          Playing as: <span className="font-semibold capitalize">{playerColor}</span>
        </div>
        <div>
          Turn: <span className="font-semibold capitalize">
            {game.turn() === 'w' ? 'White' : 'Black'}
          </span>
        </div>
        {game.inCheck() && (
          <div className="text-red-600 font-bold">
            CHECK!
          </div>
        )}
      </div>

      {/* Move History Preview */}
      <div className="mt-2 text-xs text-gray-500 max-w-full">
        <div className="flex flex-wrap gap-1">
          {moveHistory.slice(-6).map((move, index) => (
            <span key={index} className="px-1">
              {move}
            </span>
          ))}
        </div>
        {moveHistory.length > 6 && <span>... ({moveHistory.length} moves total)</span>}
      </div>
    </div>
  );
}