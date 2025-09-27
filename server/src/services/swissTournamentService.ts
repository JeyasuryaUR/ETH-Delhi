import { prisma } from '../lib/prisma';

export interface Player {
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
  previousOpponents: string[];
}

export interface Pairing {
  white: Player;
  black: Player;
  boardNumber: number;
}

export class SwissTournamentService {
  /**
   * Calculate the number of rounds needed for a Swiss tournament
   */
  static calculateRounds(participantCount: number): number {
    if (participantCount <= 1) return 0;
    if (participantCount <= 2) return 1;
    if (participantCount <= 4) return 2;
    if (participantCount <= 8) return 3;
    if (participantCount <= 16) return 4;
    if (participantCount <= 32) return 5;
    if (participantCount <= 64) return 6;
    if (participantCount <= 128) return 7;
    if (participantCount <= 256) return 8;
    return Math.ceil(Math.log2(participantCount));
  }

  /**
   * Get participants for a contest with their current standings
   */
  static async getContestParticipants(contestId: string): Promise<Player[]> {
    const participants = await prisma.contest_participants.findMany({
      where: { contest_id: contestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            rating_cached: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { buchholz_score: 'desc' },
        { sonneborn_berger: 'desc' },
        { rating_at_start: 'desc' }
      ]
    });

    // Get previous opponents for each player
    const previousOpponents = await this.getPreviousOpponents(contestId);

    return participants.map(p => ({
      id: p.id,
      userId: p.user_id,
      username: p.user.username,
      displayName: p.user.display_name || p.user.username,
      rating: p.rating_at_start || p.user.rating_cached,
      score: Number(p.score),
      wins: p.wins,
      losses: p.losses,
      draws: p.draws,
      byes: p.byes,
      buchholzScore: Number(p.buchholz_score),
      sonnebornBerger: Number(p.sonneborn_berger),
      previousOpponents: previousOpponents[p.id] || []
    }));
  }

  /**
   * Get previous opponents for each player in the tournament
   */
  static async getPreviousOpponents(contestId: string): Promise<Record<string, string[]>> {
    const games = await prisma.games.findMany({
      where: {
        contest_id: contestId,
        result: { not: null }
      },
      select: {
        white_id: true,
        black_id: true
      }
    });

    const opponents: Record<string, string[]> = {};
    
    games.forEach((game: any) => {
      if (game.white_id && game.black_id) {
        if (!opponents[game.white_id]) opponents[game.white_id] = [];
        if (!opponents[game.black_id]) opponents[game.black_id] = [];
        
        opponents[game.white_id].push(game.black_id);
        opponents[game.black_id].push(game.white_id);
      }
    });

    return opponents;
  }

  /**
   * Generate Swiss pairings for a round
   */
  static generateSwissPairings(players: Player[], roundNumber: number): Pairing[] {
    if (players.length === 0) return [];
    if (players.length === 1) {
      // Single player gets a bye
      return [{
        white: players[0],
        black: players[0], // Special case for bye
        boardNumber: 1
      }];
    }

    const pairings: Pairing[] = [];
    const unpaired = [...players];
    let boardNumber = 1;

    // Group players by score
    const scoreGroups = this.groupPlayersByScore(unpaired);

    for (const scoreGroup of scoreGroups) {
      if (scoreGroup.length === 0) continue;

      // Sort by tiebreak criteria within score group
      scoreGroup.sort((a, b) => {
        if (b.buchholzScore !== a.buchholzScore) {
          return b.buchholzScore - a.buchholzScore;
        }
        if (b.sonnebornBerger !== a.sonnebornBerger) {
          return b.sonnebornBerger - a.sonnebornBerger;
        }
        return b.rating - a.rating;
      });

      // Pair players within the score group
      const groupPairings = this.pairPlayersInGroup(scoreGroup, roundNumber);
      
      for (const pairing of groupPairings) {
        pairings.push({
          ...pairing,
          boardNumber: boardNumber++
        });
      }
    }

    return pairings;
  }

  /**
   * Group players by their current score
   */
  private static groupPlayersByScore(players: Player[]): Player[][] {
    const scoreGroups: Record<number, Player[]> = {};
    
    players.forEach(player => {
      const score = player.score;
      if (!scoreGroups[score]) {
        scoreGroups[score] = [];
      }
      scoreGroups[score].push(player);
    });

    // Sort score groups by score (descending)
    return Object.keys(scoreGroups)
      .map(score => Number(score))
      .sort((a, b) => b - a)
      .map(score => scoreGroups[score]);
  }

  /**
   * Pair players within a score group using Dutch system
   */
  private static pairPlayersInGroup(players: Player[], roundNumber: number): Pairing[] {
    const pairings: Pairing[] = [];
    let unpaired = [...players];

    // Handle odd number of players first (give bye to lowest rated)
    if (unpaired.length % 2 === 1) {
      // Find the lowest-rated player who hasn't had a bye yet
      let byePlayerIndex = unpaired.length - 1;
      for (let i = unpaired.length - 1; i >= 0; i--) {
        if (unpaired[i].byes === 0) {
          byePlayerIndex = i;
          break;
        }
      }
      
      const byePlayer = unpaired.splice(byePlayerIndex, 1)[0];
      pairings.push({ white: byePlayer, black: byePlayer, boardNumber: 0 });
    }

    // Dutch system pairing: top half vs bottom half
    const half = Math.floor(unpaired.length / 2);
    const topHalf = unpaired.slice(0, half);
    const bottomHalf = unpaired.slice(half);

    for (let i = 0; i < topHalf.length && i < bottomHalf.length; i++) {
      const player1 = topHalf[i];
      let bestOpponent: Player | null = null;
      let bestOpponentIndex = -1;
      let bestScore = Infinity;

      // Find best opponent from bottom half
      for (let j = 0; j < bottomHalf.length; j++) {
        const player2 = bottomHalf[j];
        
        // Skip if they've played before
        if (this.countPreviousMeetings(player1, player2) > 0) {
          continue;
        }

        // Calculate pairing score (prefer closer ratings and color balance)
        let score = Math.abs(player1.rating - player2.rating) / 100;
        
        // Add color preference penalty
        const player1WhiteGames = this.countWhiteGames(player1);
        const player1BlackGames = this.countBlackGames(player1);
        const player2WhiteGames = this.countWhiteGames(player2);
        const player2BlackGames = this.countBlackGames(player2);
        
        // Prefer giving white to player who has had fewer white games
        if (player1WhiteGames <= player1BlackGames && player2WhiteGames > player2BlackGames) {
          score -= 0.5; // Bonus for good color distribution
        } else if (player1WhiteGames > player1BlackGames && player2WhiteGames <= player2BlackGames) {
          score += 0.5; // Penalty for poor color distribution
        }

        if (score < bestScore) {
          bestScore = score;
          bestOpponent = player2;
          bestOpponentIndex = j;
        }
      }

      if (bestOpponent && bestOpponentIndex >= 0) {
        // Remove the selected opponent from bottom half
        bottomHalf.splice(bestOpponentIndex, 1);
        
        // Determine colors based on color balance
        const player1WhiteGames = this.countWhiteGames(player1);
        const player1BlackGames = this.countBlackGames(player1);
        const player2WhiteGames = this.countWhiteGames(bestOpponent);
        const player2BlackGames = this.countBlackGames(bestOpponent);
        
        let white: Player, black: Player;
        
        if (player1WhiteGames < player1BlackGames) {
          white = player1;
          black = bestOpponent;
        } else if (player2WhiteGames < player2BlackGames) {
          white = bestOpponent;
          black = player1;
        } else {
          // Equal color distribution, use rating
          white = player1.rating >= bestOpponent.rating ? player1 : bestOpponent;
          black = player1.rating >= bestOpponent.rating ? bestOpponent : player1;
        }
        
        pairings.push({ white, black, boardNumber: 0 });
      }
    }

    return pairings;
  }

  /**
   * Count previous meetings between two players
   */
  private static countPreviousMeetings(player1: Player, player2: Player): number {
    return player1.previousOpponents.filter(opponentId => 
      opponentId === player2.userId
    ).length;
  }

  /**
   * Count white games for a player (simplified - assumes half are white)
   */
  private static countWhiteGames(player: Player): number {
    const totalGames = player.wins + player.losses + player.draws;
    return Math.floor(totalGames / 2);
  }

  /**
   * Count black games for a player (simplified - assumes half are black)
   */
  private static countBlackGames(player: Player): number {
    const totalGames = player.wins + player.losses + player.draws;
    return Math.ceil(totalGames / 2);
  }

  /**
   * Create a new tournament round
   */
  static async createTournamentRound(contestId: string, roundNumber: number): Promise<string> {
    const round = await prisma.tournament_rounds.create({
      data: {
        contest_id: contestId,
        round_number: roundNumber,
        status: 'pending'
      }
    });

    return round.id;
  }

  /**
   * Start a tournament round and create pairings
   */
  static async startTournamentRound(contestId: string, roundNumber: number): Promise<Pairing[]> {
    // Get current participants
    const participants = await this.getContestParticipants(contestId);
    
    if (participants.length === 0) {
      throw new Error('No participants found for the tournament');
    }

    // Generate pairings
    const pairings = this.generateSwissPairings(participants, roundNumber);
    
    // Create or update the round
    let round = await prisma.tournament_rounds.findUnique({
      where: {
        contest_id_round_number: {
          contest_id: contestId,
          round_number: roundNumber
        }
      }
    });

    if (!round) {
      round = await prisma.tournament_rounds.create({
        data: {
          contest_id: contestId,
          round_number: roundNumber,
          status: 'active',
          start_at: new Date()
        }
      });
    } else {
      await prisma.tournament_rounds.update({
        where: { id: round.id },
        data: {
          status: 'active',
          start_at: new Date()
        }
      });
    }

    // Create games for each pairing
    for (const pairing of pairings) {
      if (pairing.white.userId === pairing.black.userId) {
        // This is a bye - update participant stats
        await prisma.contest_participants.update({
          where: { id: pairing.white.id },
          data: {
            byes: { increment: 1 },
            score: { increment: 1 } // Bye gives 1 point
          }
        });
      } else {
        // Create actual game
        await prisma.games.create({
          data: {
            contest_id: contestId,
            round_id: round.id,
            round_number: roundNumber,
            white_id: pairing.white.userId,
            black_id: pairing.black.userId,
            white_rating_before: pairing.white.rating,
            black_rating_before: pairing.black.rating,
            time_control: 'standard', // This should come from contest settings
            rated: true
          }
        });
      }
    }

    return pairings;
  }

  /**
   * Complete a tournament round
   */
  static async completeTournamentRound(contestId: string, roundNumber: number): Promise<void> {
    // Update round status
    await prisma.tournament_rounds.updateMany({
      where: {
        contest_id: contestId,
        round_number: roundNumber
      },
      data: {
        status: 'completed',
        end_at: new Date()
      }
    });

    // Update participant scores and tiebreaks
    await this.updateParticipantScores(contestId);
  }

  /**
   * Update participant scores and tiebreak calculations
   */
  static async updateParticipantScores(contestId: string): Promise<void> {
    const participants = await prisma.contest_participants.findMany({
      where: { contest_id: contestId },
      include: {
        user: true
      }
    });

    for (const participant of participants) {
      // Get all games for this participant
      const games = await prisma.games.findMany({
        where: {
          contest_id: contestId,
          OR: [
            { white_id: participant.user_id },
            { black_id: participant.user_id }
          ],
          result: { not: null }
        }
      });

      let wins = 0;
      let losses = 0;
      let draws = 0;
      let score = 0;

      // Calculate wins, losses, draws, and score
      for (const game of games) {
        if (game.result === '1-0' && game.white_id === participant.user_id) {
          wins++;
          score += 1;
        } else if (game.result === '0-1' && game.black_id === participant.user_id) {
          wins++;
          score += 1;
        } else if (game.result === '0-1' && game.white_id === participant.user_id) {
          losses++;
        } else if (game.result === '1-0' && game.black_id === participant.user_id) {
          losses++;
        } else if (game.result === '1/2-1/2') {
          draws++;
          score += 0.5;
        }
      }

      // Calculate Buchholz score (sum of opponents' scores)
      const buchholzScore = await this.calculateBuchholzScore(contestId, participant.user_id);
      
      // Calculate Sonneborn-Berger score
      const sonnebornBerger = await this.calculateSonnebornBerger(contestId, participant.user_id);

      // Update participant
      await prisma.contest_participants.update({
        where: { id: participant.id },
        data: {
          wins,
          losses,
          draws,
          score,
          buchholz_score: buchholzScore,
          sonneborn_berger: sonnebornBerger
        }
      });
    }
  }

  /**
   * Calculate Buchholz score for a participant
   */
  private static async calculateBuchholzScore(contestId: string, userId: string): Promise<number> {
    // Get all opponents and their scores
    const games = await prisma.games.findMany({
      where: {
        contest_id: contestId,
        OR: [
          { white_id: userId },
          { black_id: userId }
        ],
        result: { not: null }
      },
      select: {
        white_id: true,
        black_id: true
      }
    });

    const opponentIds = new Set<string>();
    games.forEach(game => {
      if (game.white_id === userId) {
        opponentIds.add(game.black_id!);
      } else {
        opponentIds.add(game.white_id!);
      }
    });

    // Get scores of all opponents
    const opponentScores = await prisma.contest_participants.findMany({
      where: {
        contest_id: contestId,
        user_id: { in: Array.from(opponentIds) }
      },
      select: { score: true }
    });

    return opponentScores.reduce((sum: number, p: any) => sum + Number(p.score), 0);
  }

  /**
   * Calculate Sonneborn-Berger score for a participant
   */
  private static async calculateSonnebornBerger(contestId: string, userId: string): Promise<number> {
    const games = await prisma.games.findMany({
      where: {
        contest_id: contestId,
        OR: [
          { white_id: userId },
          { black_id: userId }
        ],
        result: { not: null }
      },
      include: {
        white: { select: { id: true } },
        black: { select: { id: true } }
      }
    });

    let sonnebornBerger = 0;

    for (const game of games) {
      const isWhite = game.white_id === userId;
      const opponentId = isWhite ? game.black_id : game.white_id;
      
      if (!opponentId) continue;

      // Get opponent's score
      const opponent = await prisma.contest_participants.findFirst({
        where: {
          contest_id: contestId,
          user_id: opponentId
        },
        select: { score: true }
      });

      if (!opponent) continue;

      const opponentScore = Number(opponent.score);
      let gameScore = 0;

      if (game.result === '1-0' && isWhite) gameScore = 1;
      else if (game.result === '0-1' && !isWhite) gameScore = 1;
      else if (game.result === '1/2-1/2') gameScore = 0.5;

      sonnebornBerger += gameScore * opponentScore;
    }

    return sonnebornBerger;
  }

  /**
   * Start a Swiss tournament
   */
  static async startSwissTournament(contestId: string): Promise<void> {
    // Get participants
    const participants = await this.getContestParticipants(contestId);
    
    if (participants.length < 2) {
      throw new Error('Need at least 2 participants to start a tournament');
    }

    // Calculate number of rounds
    const totalRounds = this.calculateRounds(participants.length);

    // Update contest with tournament details
    await prisma.contests.update({
      where: { id: contestId },
      data: {
        status: 'active',
        tournament_type: 'swiss',
        total_rounds: totalRounds,
        current_round: 0
      }
    });

    // Store initial ratings for all participants
    const participantsToUpdate = await prisma.contest_participants.findMany({
      where: { contest_id: contestId },
      include: { user: true }
    });

    for (const participant of participantsToUpdate) {
      await prisma.contest_participants.update({
        where: { id: participant.id },
        data: {
          rating_at_start: participant.user.rating_cached
        }
      });
    }

    // Start first round
    await this.startTournamentRound(contestId, 1);
    
    // Update contest current round
    await prisma.contests.update({
      where: { id: contestId },
      data: { current_round: 1 }
    });
  }

  /**
   * Complete a Swiss tournament and update final ratings
   */
  static async completeSwissTournament(contestId: string): Promise<void> {
    // Update contest status
    await prisma.contests.update({
      where: { id: contestId },
      data: {
        status: 'completed',
        end_at: new Date()
      }
    });

    // Calculate and update final ratings for all participants
    await this.updateFinalRatings(contestId);
  }

  /**
   * Update final ratings after tournament completion
   */
  static async updateFinalRatings(contestId: string): Promise<void> {
    const participants = await prisma.contest_participants.findMany({
      where: { contest_id: contestId },
      include: { user: true }
    });

    for (const participant of participants) {
      const newRating = await this.calculateNewRating(
        participant.rating_at_start || participant.user.rating_cached,
        participant.wins,
        participant.losses,
        participant.draws
      );

      // Update participant's final rating
      await prisma.contest_participants.update({
        where: { id: participant.id },
        data: { rating_at_end: newRating }
      });

      // Update user's cached rating
      await prisma.users.update({
        where: { id: participant.user_id },
        data: { 
          rating_cached: newRating,
          rating_cached_updated_at: new Date()
        }
      });

      // Add to rating history
      await prisma.ratings_history.create({
        data: {
          user_id: participant.user_id,
          rating_type: 'standard',
          rating: newRating,
          source: 'tournament',
          metadata: {
            contest_id: contestId,
            wins: participant.wins,
            losses: participant.losses,
            draws: participant.draws,
            score: participant.score
          }
        }
      });
    }
  }

  /**
   * Get tournament rounds for a contest
   */
  static async getTournamentRounds(contestId: string): Promise<any[]> {
    return await prisma.tournament_rounds.findMany({
      where: { contest_id: contestId },
      include: {
        games: {
          include: {
            white: {
              select: {
                id: true,
                username: true,
                display_name: true,
                rating_cached: true
              }
            },
            black: {
              select: {
                id: true,
                username: true,
                display_name: true,
                rating_cached: true
              }
            },
            winner: {
              select: {
                id: true,
                username: true,
                display_name: true
              }
            }
          }
        }
      },
      orderBy: { round_number: 'asc' }
    });
  }

  /**
   * Get current round pairings
   */
  static async getCurrentRoundPairings(contestId: string): Promise<any> {
    const contest = await prisma.contests.findUnique({
      where: { id: contestId },
      select: { current_round: true, total_rounds: true, status: true }
    });

    if (!contest || contest.current_round === 0) {
      return null;
    }

    const round = await prisma.tournament_rounds.findUnique({
      where: {
        contest_id_round_number: {
          contest_id: contestId,
          round_number: contest.current_round
        }
      },
      include: {
        games: {
          include: {
            white: {
              select: {
                id: true,
                username: true,
                display_name: true,
                rating_cached: true
              }
            },
            black: {
              select: {
                id: true,
                username: true,
                display_name: true,
                rating_cached: true
              }
            }
          }
        }
      }
    });

    return {
      roundNumber: contest.current_round,
      totalRounds: contest.total_rounds,
      contestStatus: contest.status,
      roundStatus: round?.status || 'pending',
      pairings: round?.games || []
    };
  }

  /**
   * Check if current round is complete
   */
  static async isRoundComplete(contestId: string, roundNumber: number): Promise<boolean> {
    const games = await prisma.games.findMany({
      where: {
        contest_id: contestId,
        round_number: roundNumber
      }
    });

    if (games.length === 0) return false;

    return games.every((game: any) => game.result !== null);
  }

  /**
   * Auto-advance to next round if current round is complete
   */
  static async checkAndAdvanceRound(contestId: string): Promise<boolean> {
    const contest = await prisma.contests.findUnique({
      where: { id: contestId },
      select: { current_round: true, total_rounds: true, status: true }
    });

    if (!contest || contest.status !== 'active' || contest.current_round === 0) {
      return false;
    }

    const isComplete = await this.isRoundComplete(contestId, contest.current_round);
    
    if (!isComplete) return false;

    // Complete the current round
    await this.completeTournamentRound(contestId, contest.current_round);

    // Check if tournament is finished
    if (contest.current_round >= (contest.total_rounds || 0)) {
      await this.completeSwissTournament(contestId);
      return true;
    }

    // Wait 10 seconds before starting next round (as requested)
    setTimeout(async () => {
      try {
        const nextRound = contest.current_round + 1;
        await this.startTournamentRound(contestId, nextRound);
        
        await prisma.contests.update({
          where: { id: contestId },
          data: { current_round: nextRound }
        });
      } catch (error) {
        console.error('Error advancing to next round:', error);
      }
    }, 10000);

    return true;
  }

  /**
   * Submit game result and check for round advancement
   */
  static async submitGameResult(gameId: string, result: string, winnerId?: string): Promise<void> {
    // Update the game
    const game = await prisma.games.update({
      where: { id: gameId },
      data: {
        result,
        winner_id: winnerId,
        ended_at: new Date()
      }
    });

    if (!game.contest_id) return;

    // Check if this was the last game of the round
    const roundAdvanced = await this.checkAndAdvanceRound(game.contest_id);
    
    if (roundAdvanced) {
      console.log(`Round ${game.round_number} completed for contest ${game.contest_id}`);
    }
  }
  private static async calculateNewRating(
    currentRating: number,
    wins: number,
    losses: number,
    draws: number
  ): Promise<number> {
    const K = 32; // K-factor for rating changes
    const totalGames = wins + losses + draws;
    
    if (totalGames === 0) return currentRating;

    // Calculate expected score (simplified)
    const actualScore = wins + (draws * 0.5);
    const expectedScore = totalGames * 0.5; // Simplified - assumes average opponent rating
    
    const ratingChange = Math.round(K * (actualScore - expectedScore));
    const newRating = currentRating + ratingChange;
    
    // Ensure rating doesn't go below 100
    return Math.max(100, newRating);
  }
}
