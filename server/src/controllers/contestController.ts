import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { SwissTournamentService } from '../services/swissTournamentService';

export const createContest = async (req: Request, res: Response) => {
  try {
    const {
      title,
      type = 'standard',
      timeControl,
      startDate,
      endDate,
      prizePool,
      maxParticipants,
      totalRounds,
      organizerWalletAddress,
      settings
    } = req.body ?? {};

    // Basic required fields check
    if (!title || !startDate || !endDate || prizePool === undefined || !maxParticipants || !totalRounds) {
      return res.status(400).json({
        success: false,
        message: 'title, startDate, endDate, prizePool, maxParticipants, and totalRounds are required',
      });
    }

    // Extract and validate dates from string
    let start: Date;
    let end: Date;
    
    try {
      // Handle different date string formats
      if (typeof startDate === 'string') {
        // If it's just a date string (YYYY-MM-DD), add time
        if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          start = new Date(startDate + 'T00:00:00');
        } else {
          start = new Date(startDate);
        }
      } else {
        start = new Date(startDate);
      }
      
      if (typeof endDate === 'string') {
        // If it's just a date string (YYYY-MM-DD), add time
        if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          end = new Date(endDate + 'T23:59:59');
        } else {
          end = new Date(endDate);
        }
      } else {
        end = new Date(endDate);
      }
    } catch (dateError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format provided',
      });
    }
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    if (prizePool <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Prize pool must be greater than 0',
      });
    }

    // Validate type
    const validTypes = ['standard', 'blitz', 'bullet'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be one of: standard, blitz, bullet',
      });
    }

    // Validate maxParticipants
    if (maxParticipants < 2) {
      return res.status(400).json({
        success: false,
        message: 'Max participants must be at least 2',
      });
    }

    // Validate totalRounds
    if (totalRounds < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total rounds must be at least 1',
      });
    }

    // Validate timeControl format (basic validation)
    if (timeControl && typeof timeControl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Time control must be a string',
      });
    }

    // Check if database is available
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(503).json({
        success: false,
        message: 'Database not available. Please check your database connection.',
      });
    }

    // Look up organizer by wallet address if provided
    let organizerId = null;
    if (organizerWalletAddress) {
      const organizer = await prisma.users.findUnique({
        where: { wallet_address: organizerWalletAddress },
        select: { id: true, username: true, display_name: true }
      });

      if (!organizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer wallet address not found in the system',
        });
      }

      organizerId = organizer.id;
    }

    // Create contest
    const contest = await prisma.contests.create({
      data: {
        title: String(title),
        type: String(type),
        time_control: timeControl,
        start_at: start,
        end_at: end,
        organizer_id: organizerId,
        prize_pool: Math.round(Number(prizePool) * 100), // Convert to cents for integer storage
        max_participants: Number(maxParticipants),
        total_rounds: Number(totalRounds),
        settings: settings || {
          prizePool: Number(prizePool),
          maxParticipants: Number(maxParticipants),
          totalRounds: Number(totalRounds),
          termsAccepted: true
        },
        status: 'registration'
      },
    });

    return res.status(201).json({ 
      success: true, 
      data: contest,
      message: 'Contest created successfully'
    });
  } catch (err: any) {
    console.error('createContest error:', err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A contest with this title already exists',
      });
    }
    
    if (err.code === 'P1001') {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please check your database configuration.',
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const getContestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID is required',
      });
    }

    const contest = await prisma.contests.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            display_name: true,
            wallet_address: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                wallet_address: true,
                rating_cached: true
              }
            }
          }
        },
        games: {
          include: {
            white: {
              select: {
                id: true,
                username: true,
                display_name: true
              }
            },
            black: {
              select: {
                id: true,
                username: true,
                display_name: true
              }
            },
            winner: {
              select: {
                id: true,
                username: true,
                display_name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: contest,
    });
  } catch (err: any) {
    console.error('getContestById error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getAllContests = async (req: Request, res: Response) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const whereClause = status ? { status: String(status) } : {};

    const contests = await prisma.contests.findMany({
      where: whereClause,
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            display_name: true,
            wallet_address: true
          }
        },
        _count: {
          select: {
            participants: true,
            games: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.contests.count({
      where: whereClause
    });

    return res.status(200).json({
      success: true,
      data: {
        contests,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err: any) {
    console.error('getAllContests error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getUpcomingContests = async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const now = new Date();

    const contests = await prisma.contests.findMany({
      where: {
        status: 'registration',
        start_at: {
          gt: now // Start date is in the future
        }
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            display_name: true,
            wallet_address: true
          }
        },
        _count: {
          select: {
            participants: true,
            games: true
          }
        }
      },
      orderBy: {
        start_at: 'asc' // Show earliest contests first
      },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.contests.count({
      where: {
        status: 'registration',
        start_at: {
          gt: now
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        contests,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err: any) {
    console.error('getUpcomingContests error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getOngoingContests = async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const now = new Date();

    const contests = await prisma.contests.findMany({
      where: {
        status: 'active',
        start_at: {
          lte: now // Contest has started
        },
        end_at: {
          gt: now // Contest hasn't ended yet
        }
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            display_name: true,
            wallet_address: true
          }
        },
        _count: {
          select: {
            participants: true,
            games: true
          }
        }
      },
      orderBy: {
        start_at: 'desc' // Show most recently started contests first
      },
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.contests.count({
      where: {
        status: 'active',
        start_at: {
          lte: now
        },
        end_at: {
          gt: now
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        contests,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err: any) {
    console.error('getOngoingContests error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const joinContest = async (req: Request, res: Response) => {
  try {
    const { contestId, walletAddress } = req.body;

    if (!contestId || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'contestId and walletAddress are required',
      });
    }

    // Fetch user by wallet address
    const user = await prisma.users.findUnique({
      where: { wallet_address: walletAddress }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with the provided wallet address not found',
      });
    }

    const userId = user.id;

    // Check if contest exists and is in registration phase
    const contest = await prisma.contests.findUnique({
      where: { id: contestId },
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Check if contest is in registration phase
    if (contest.status !== 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Contest is not accepting new participants',
      });
    }

    // Check if contest has started
    const now = new Date();
    if (contest.start_at && contest.start_at <= now) {
      return res.status(400).json({
        success: false,
        message: 'Contest has already started',
      });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.contest_participants.findUnique({
      where: {
        contest_id_user_id: {
          contest_id: contestId,
          user_id: userId
        }
      }
    });

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: 'You are already a participant in this contest',
      });
    }

    // Check max participants limit
    const settings = contest.settings as any;
    const maxParticipants = settings?.maxParticipants || 40;
    if (contest._count.participants >= maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Contest is full',
      });
    }

    // Add participant to contest
    const participant = await prisma.contest_participants.create({
      data: {
        contest_id: contestId,
        user_id: userId,
        score: 0
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            wallet_address: true,
            rating_cached: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: participant,
      message: 'Successfully joined the contest'
    });
  } catch (err: any) {
    console.error('joinContest error:', err);

    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'You are already a participant in this contest',
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

export const getContestParticipants = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID is required',
      });
    }

    // Check if contest exists
    const contest = await prisma.contests.findUnique({
      where: { id: contestId },
      select: { id: true, title: true, status: true }
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    // Get participants
    const participants = await prisma.contest_participants.findMany({
      where: { contest_id: contestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            wallet_address: true,
            rating_cached: true,
            rating_type_cached: true
          }
        }
      },
      orderBy: [
        { score: 'desc' }, // Sort by score descending
        { joined_at: 'asc' } // Then by join time ascending
      ],
      take: Number(limit),
      skip: Number(offset)
    });

    const total = await prisma.contest_participants.count({
      where: { contest_id: contestId }
    });

    return res.status(200).json({
      success: true,
      data: {
        contest: {
          id: contest.id,
          title: contest.title,
          status: contest.status
        },
        participants,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (err: any) {
    console.error('getContestParticipants error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Start a Swiss tournament
export const startSwissTournament = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID is required',
      });
    }

    // Check if contest exists and is in registration phase
    const contest = await prisma.contests.findUnique({
      where: { id: contestId },
      include: {
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    if (contest.status !== 'registration') {
      return res.status(400).json({
        success: false,
        message: 'Contest is not in registration phase',
      });
    }

    if (contest._count.participants < 2) {
      return res.status(400).json({
        success: false,
        message: 'Need at least 2 participants to start a tournament',
      });
    }

    // Start the Swiss tournament
    await SwissTournamentService.startSwissTournament(contestId);

    return res.status(200).json({
      success: true,
      message: 'Swiss tournament started successfully',
      data: {
        contestId,
        totalRounds: 5, // This will be calculated by the service
        currentRound: 1
      }
    });
  } catch (err: any) {
    console.error('startSwissTournament error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Start a tournament round
export const startTournamentRound = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const { roundNumber } = req.body;

    if (!contestId || !roundNumber) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID and round number are required',
      });
    }

    // Check if contest exists and is active
    const contest = await prisma.contests.findUnique({
      where: { id: contestId }
    });

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found',
      });
    }

    if (contest.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Contest is not active',
      });
    }

    // Start the round
    const pairings = await SwissTournamentService.startTournamentRound(contestId, roundNumber);

    // Update contest current round
    await prisma.contests.update({
      where: { id: contestId },
      data: { current_round: roundNumber }
    });

    return res.status(200).json({
      success: true,
      message: `Round ${roundNumber} started successfully`,
      data: {
        contestId,
        roundNumber,
        pairings: pairings.map(p => ({
          boardNumber: p.boardNumber,
          white: {
            id: p.white.userId,
            username: p.white.username,
            displayName: p.white.displayName,
            rating: p.white.rating,
            score: p.white.score
          },
          black: {
            id: p.black.userId,
            username: p.black.username,
            displayName: p.black.displayName,
            rating: p.black.rating,
            score: p.black.score
          },
          isBye: p.white.userId === p.black.userId
        }))
      }
    });
  } catch (err: any) {
    console.error('startTournamentRound error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Complete a tournament round
export const completeTournamentRound = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;
    const { roundNumber } = req.body;

    if (!contestId || !roundNumber) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID and round number are required',
      });
    }

    // Complete the round
    await SwissTournamentService.completeTournamentRound(contestId, roundNumber);

    return res.status(200).json({
      success: true,
      message: `Round ${roundNumber} completed successfully`,
      data: {
        contestId,
        roundNumber
      }
    });
  } catch (err: any) {
    console.error('completeTournamentRound error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get tournament standings
export const getTournamentStandings = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID is required',
      });
    }

    // Get participants with their standings
    const participants = await SwissTournamentService.getContestParticipants(contestId);

    // Sort by score, then by tiebreaks
    participants.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.buchholzScore !== a.buchholzScore) return b.buchholzScore - a.buchholzScore;
      if (b.sonnebornBerger !== a.sonnebornBerger) return b.sonnebornBerger - a.sonnebornBerger;
      return b.rating - a.rating;
    });

    return res.status(200).json({
      success: true,
      data: {
        contestId,
        standings: participants.map((p, index) => ({
          position: index + 1,
          id: p.id,
          userId: p.userId,
          username: p.username,
          displayName: p.displayName,
          rating: p.rating,
          score: p.score,
          wins: p.wins,
          losses: p.losses,
          draws: p.draws,
          byes: p.byes,
          buchholzScore: p.buchholzScore,
          sonnebornBerger: p.sonnebornBerger
        }))
      }
    });
  } catch (err: any) {
    console.error('getTournamentStandings error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Complete Swiss tournament
export const completeSwissTournament = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID is required',
      });
    }

    // Complete the tournament
    await SwissTournamentService.completeSwissTournament(contestId);

    return res.status(200).json({
      success: true,
      message: 'Swiss tournament completed successfully',
      data: {
        contestId
      }
    });
  } catch (err: any) {
    console.error('completeSwissTournament error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get tournament rounds
export const getTournamentRounds = async (req: Request, res: Response) => {
  try {
    const { contestId } = req.params;

    if (!contestId) {
      return res.status(400).json({
        success: false,
        message: 'Contest ID is required',
      });
    }

    const rounds = await prisma.tournament_rounds.findMany({
      where: { contest_id: contestId },
      include: {
        games: {
          include: {
            white: {
              select: {
                id: true,
                username: true,
                display_name: true
              }
            },
            black: {
              select: {
                id: true,
                username: true,
                display_name: true
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

    return res.status(200).json({
      success: true,
      data: {
        contestId,
        rounds: rounds.map(round => ({
          id: round.id,
          roundNumber: round.round_number,
          status: round.status,
          startAt: round.start_at,
          endAt: round.end_at,
          games: round.games.map(game => ({
            id: game.id,
            white: game.white,
            black: game.black,
            winner: game.winner,
            result: game.result,
            started_at: game.started_at,
            ended_at: game.ended_at
          }))
        }))
      }
    });
  } catch (err: any) {
    console.error('getTournamentRounds error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
