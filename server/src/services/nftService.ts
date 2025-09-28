import { prisma } from '../lib/prisma';

// Define the Winner enum to match the smart contract
enum Winner {
  DRAW = 0,
  WHITE = 1, 
  BLACK = 2
}

interface GameData {
  id: string;
  whitePlayer: {
    wallet_address: string;
    username: string;
    display_name?: string;
  };
  blackPlayer: {
    wallet_address: string;
    username: string;
    display_name?: string;
  };
  result: string;
  pgn?: string;
  moves?: string;
  created_at: Date;
  ended_at?: Date;
  round_number: number;
}

export class NFTService {
  
  /**
   * Prepare canonical game data for NFT minting
   */
  static async prepareCanonicalGameForNFT(gameId: string): Promise<any | null> {
    try {
      // Fetch the complete game data
      const game = await prisma.games.findUnique({
        where: { id: gameId },
        include: {
          white: {
            select: {
              wallet_address: true,
              username: true,
              display_name: true
            }
          },
          black: {
            select: {
              wallet_address: true,
              username: true,
              display_name: true
            }
          },
          contest: {
            select: {
              title: true,
              type: true,
              id: true
            }
          }
        }
      });

      if (!game || !game.white || !game.black) {
        console.log('❌ Game not found or missing player data for NFT minting');
        return null;
      }

      // Determine winner based on game result
      let winner: Winner;
      switch (game.result) {
        case '1-0':
          winner = Winner.WHITE;
          break;
        case '0-1':
          winner = Winner.BLACK;
          break;
        case '1/2-1/2':
          winner = Winner.DRAW;
          break;
        default:
          winner = Winner.DRAW;
      }

      // Parse moves from PGN or moves field
      const moves = this.extractMovesFromGame(game);
      
      // Create game metadata
      const gameMetadata = JSON.stringify({
        contestId: game.contest_id,
        contestTitle: game.contest?.title || 'Unknown Contest',
        contestType: game.contest?.type || 'standard',
        roundNumber: game.round_number,
        timeControl: game.time_control,
        startTime: game.created_at.toISOString(),
        endTime: game.ended_at?.toISOString(),
        whiteUsername: game.white.username,
        blackUsername: game.black.username,
        whiteDisplayName: game.white.display_name,
        blackDisplayName: game.black.display_name,
        whiteRatingBefore: game.white_rating_before,
        blackRatingBefore: game.black_rating_before,
        canonical: true, // Mark this as a canonical game
        mintedAt: new Date().toISOString()
      });

      const nftData = {
        whitePlayer: game.white.wallet_address,
        blackPlayer: game.black.wallet_address,
        moves: moves,
        winner: winner,
        gameMetadata: gameMetadata,
        
        // Additional data for logging/reference
        gameId: game.id,
        contestId: game.contest_id,
        roundNumber: game.round_number,
        result: game.result
      };

      console.log('🎯 CANONICAL GAME NFT DATA PREPARED:');
      console.log(`   Game ID: ${nftData.gameId}`);
      console.log(`   Contest ID: ${nftData.contestId}`);
      console.log(`   Round: ${nftData.roundNumber}`);
      console.log(`   White Player: ${nftData.whitePlayer} (${game.white.username})`);
      console.log(`   Black Player: ${nftData.blackPlayer} (${game.black.username})`);
      console.log(`   Winner: ${Winner[winner]} (${nftData.result})`);
      console.log(`   Moves Count: ${nftData.moves.length}`);
      console.log(`   Sample Moves: ${nftData.moves.slice(0, 5).join(', ')}${nftData.moves.length > 5 ? '...' : ''}`);
      console.log('   📄 Game Metadata:', JSON.parse(nftData.gameMetadata));
      
      return nftData;

    } catch (error) {
      console.error('❌ Error preparing canonical game for NFT:', error);
      return null;
    }
  }

  /**
   * Extract moves array from game data
   */
  private static extractMovesFromGame(game: any): string[] {
    try {
      // Try to parse moves from PGN first
      if (game.pgn) {
        return this.parsePGNMoves(game.pgn);
      }
      
      // Try to parse from moves field
      if (game.moves) {
        if (typeof game.moves === 'string') {
          try {
            const parsedMoves = JSON.parse(game.moves);
            if (Array.isArray(parsedMoves)) {
              return parsedMoves;
            }
          } catch (e) {
            // If it's not JSON, try splitting by space or comma
            return game.moves.split(/[\s,]+/).filter((move: string) => move.trim());
          }
        } else if (Array.isArray(game.moves)) {
          return game.moves;
        }
      }
      
      // Fallback to empty array with a note
      console.log('⚠️  No moves data found, using empty moves array for NFT');
      return ['No moves recorded'];
      
    } catch (error) {
      console.error('❌ Error extracting moves:', error);
      return ['Error parsing moves'];
    }
  }

  /**
   * Parse moves from PGN format
   */
  private static parsePGNMoves(pgn: string): string[] {
    try {
      // Remove PGN headers and metadata
      const movesSection = pgn.replace(/\[.*?\]/g, '').trim();
      
      // Extract moves (remove move numbers and result)
      const moves = movesSection
        .replace(/\d+\./g, '') // Remove move numbers
        .replace(/\{[^}]*\}/g, '') // Remove comments
        .replace(/\([^)]*\)/g, '') // Remove variations
        .replace(/[01]\/[01]-[01]\/[01]|1-0|0-1|\*/g, '') // Remove results
        .split(/\s+/)
        .filter(move => move && move.trim())
        .map(move => move.trim());
        
      return moves.length > 0 ? moves : ['No moves in PGN'];
      
    } catch (error) {
      console.error('❌ Error parsing PGN:', error);
      return ['PGN parse error'];
    }
  }

  /**
   * Simulate NFT minting (console log the data that would be sent to blockchain)
   */
  static async simulateNFTMinting(nftData: any): Promise<void> {
    console.log('\n🚀 SIMULATING NFT MINTING TRANSACTION:');
    console.log('=====================================');
    console.log('Contract Function: mintChessGame()');
    console.log('Parameters:');
    console.log(`  whitePlayer: "${nftData.whitePlayer}"`);
    console.log(`  blackPlayer: "${nftData.blackPlayer}"`);
    console.log(`  moves: [${nftData.moves.slice(0, 3).map((m: string) => `"${m}"`).join(', ')}${nftData.moves.length > 3 ? `, ... (${nftData.moves.length} total moves)` : ''}]`);
    console.log(`  winner: ${nftData.winner} (${Winner[nftData.winner]})`);
    console.log(`  gameMetadata: "${nftData.gameMetadata.substring(0, 100)}..."`);
    console.log('\n📋 Full Contract Call Data:');
    console.log({
      function: 'mintChessGame',
      args: [
        nftData.whitePlayer,
        nftData.blackPlayer, 
        nftData.moves,
        nftData.winner,
        nftData.gameMetadata
      ]
    });
    console.log('\n✅ NFT MINTING SIMULATION COMPLETE');
    console.log('   In a real implementation, this would:');
    console.log('   1. Connect to Web3 wallet');
    console.log('   2. Call the mintChessGame function');
    console.log('   3. Return the new token ID');
    console.log('   4. Update the game record with the NFT token ID');
  }

  /**
   * Main function to handle canonical game NFT minting
   */
  static async mintCanonicalGameNFT(gameId: string): Promise<void> {
    try {
      console.log('\n🎮 STARTING CANONICAL GAME NFT MINTING PROCESS...');
      console.log(`   Processing Game ID: ${gameId}`);
      
      // Prepare NFT data
      const nftData = await this.prepareCanonicalGameForNFT(gameId);
      
      if (!nftData) {
        console.log('❌ Failed to prepare NFT data');
        return;
      }
      
      // Simulate the NFT minting (in real implementation, this would call the smart contract)
      await this.simulateNFTMinting(nftData);
      
      // TODO: In real implementation, add here:
      // 1. Connect to wallet/signer
      // 2. Call contract.mintChessGame()
      // 3. Wait for transaction confirmation
      // 4. Update game record with tokenId
      // 5. Emit event or notify users
      
      console.log(`\n🏆 CANONICAL GAME NFT MINTING COMPLETED FOR GAME: ${gameId}`);
      
    } catch (error) {
      console.error('❌ Error in canonical game NFT minting:', error);
    }
  }
}