import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Types
interface ContestStanding {
  rank: number;
  ensAddress: string;
  walletAddress: string;
  rating: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
}

interface ContestData {
  contestId: string;
  contestName: string;
  startDate: string;
  endDate: string;
  totalParticipants: number;
  standings: ContestStanding[];
}

/**
 * GET /api/contests/:contestId/standings
 * Get final standings for a contest
 */
router.get('/:contestId/standings', async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;

    // Get contest information
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        participants: {
          include: {
            user: true,
            games: {
              where: {
                status: 'completed'
              }
            }
          }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Calculate standings
    const standings: ContestStanding[] = contest.participants.map((participant) => {
      let points = 0;
      let wins = 0;
      let losses = 0;
      let draws = 0;

      // Calculate points and record from games
      participant.games.forEach((game) => {
        if (game.winnerId === participant.userId) {
          points += 2; // Win = 2 points
          wins++;
        } else if (game.winnerId === null) {
          points += 1; // Draw = 1 point
          draws++;
        } else {
          losses++;
        }
      });

      return {
        rank: 0, // Will be calculated after sorting
        ensAddress: participant.user.ensAddress || `player.${participant.userId.slice(0, 6)}.eth`,
        walletAddress: participant.user.walletAddress,
        rating: participant.user.rating || 1200, // Default rating
        points,
        wins,
        losses,
        draws
      };
    });

    // Sort by points (descending), then by rating (descending), then by wins (descending)
    standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.rating !== b.rating) return b.rating - a.rating;
      return b.wins - a.wins;
    });

    // Assign ranks
    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    // Prepare response
    const contestData: ContestData = {
      contestId: contest.id,
      contestName: contest.name,
      startDate: contest.startDate.toISOString(),
      endDate: contest.endDate.toISOString(),
      totalParticipants: contest.participants.length,
      standings
    };

    res.json(contestData);
  } catch (error) {
    console.error('Error fetching contest standings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/contests/:contestId/leaderboard
 * Get contest leaderboard with optional limit
 */
router.get('/:contestId/leaderboard', async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Get contest information with participants
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        participants: {
          include: {
            user: true,
            games: {
              where: {
                status: 'completed'
              }
            }
          }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({ error: 'Contest not found' });
    }

    // Calculate standings (same logic as above)
    const standings: ContestStanding[] = contest.participants.map((participant) => {
      let points = 0;
      let wins = 0;
      let losses = 0;
      let draws = 0;

      participant.games.forEach((game) => {
        if (game.winnerId === participant.userId) {
          points += 2;
          wins++;
        } else if (game.winnerId === null) {
          points += 1;
          draws++;
        } else {
          losses++;
        }
      });

      return {
        rank: 0,
        ensAddress: participant.user.ensAddress || `player.${participant.userId.slice(0, 6)}.eth`,
        walletAddress: participant.user.walletAddress,
        rating: participant.user.rating || 1200,
        points,
        wins,
        losses,
        draws
      };
    });

    // Sort and rank
    standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.rating !== b.rating) return b.rating - a.rating;
      return b.wins - a.wins;
    });

    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    // Apply limit
    const limitedStandings = standings.slice(0, limit);

    res.json(limitedStandings);
  } catch (error) {
    console.error('Error fetching contest leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/contests/:contestId/players/:walletAddress/stats
 * Get player's contest statistics
 */
router.get('/:contestId/players/:walletAddress/stats', async (req: Request, res: Response) => {
  try {
    const { contestId, walletAddress } = req.params;

    // Get participant data
    const participant = await prisma.contestParticipant.findFirst({
      where: {
        contestId,
        user: {
          walletAddress
        }
      },
      include: {
        user: true,
        games: {
          where: {
            status: 'completed'
          }
        }
      }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Player not found in contest' });
    }

    // Calculate stats
    let points = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;

    participant.games.forEach((game) => {
      if (game.winnerId === participant.userId) {
        points += 2;
        wins++;
      } else if (game.winnerId === null) {
        points += 1;
        draws++;
      } else {
        losses++;
      }
    });

    const gamesPlayed = wins + losses + draws;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    // Get rank by counting participants with more points
    const betterParticipants = await prisma.contestParticipant.count({
      where: {
        contestId,
        points: {
          gt: points
        }
      }
    });

    const rank = betterParticipants + 1;

    res.json({
      rank,
      points,
      wins,
      losses,
      draws,
      gamesPlayed,
      winRate: Math.round(winRate * 100) / 100 // Round to 2 decimal places
    });
  } catch (error) {
    console.error('Error fetching player contest stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
