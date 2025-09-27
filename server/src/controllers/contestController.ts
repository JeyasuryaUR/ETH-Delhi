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
