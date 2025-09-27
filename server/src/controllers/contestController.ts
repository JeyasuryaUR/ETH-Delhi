import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const createContest = async (req: Request, res: Response) => {
  try {
    const {
      title,
      type = 'standard',
      startDate,
      endDate,
      prizePool,
      organizerId,
      timeControl,
      settings
    } = req.body ?? {};

    // Basic required fields check
    if (!title || !startDate || !endDate || prizePool === undefined) {
      return res.status(400).json({
        success: false,
        message: 'title, startDate, endDate, and prizePool are required',
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

    // Create contest
    const contest = await prisma.contests.create({
      data: {
        title: String(title),
        type: String(type),
        time_control: timeControl || null,
        start_at: start,
        end_at: end,
        organizer_id: organizerId || null,
        prize_pool: Math.round(Number(prizePool) * 100), // Convert to cents for integer storage
        settings: settings || {
          prizePool: Number(prizePool),
          maxParticipants: 40, // Default from frontend
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
    const { contestId, userId } = req.body;

    if (!contestId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'contestId and userId are required',
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
