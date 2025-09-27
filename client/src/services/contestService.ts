/**
 * Contest Service
 * Provides API functions for contest-related operations
 */

import { API_BASE } from "@/lib/config";

// Types
export interface ContestStanding {
  rank: number;
  ensAddress: string;
  walletAddress: string;
  rating: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface ContestData {
  contestId: string;
  contestName: string;
  startDate: string;
  endDate: string;
  totalParticipants: number;
  standings: ContestStanding[];
}

export interface CreateContestRequest {
  contestName: string;
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  entryFee?: number;
}

export interface Contest {
  contestId: string;
  contestName: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  totalParticipants: number;
  maxParticipants?: number;
  entryFee?: number;
  prizePool?: number;
}

// API Configuration
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Fetch contest standings by contest ID
 */
export const fetchContestStandings = async (contestId: string): Promise<ContestData> => {
  const response = await fetch(`${API_BASE}/contests/${contestId}/standings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch contest standings: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch all contests
 */
export const fetchContests = async (): Promise<Contest[]> => {
  const response = await fetch(`${API_BASE}/contests`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch contests: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch a specific contest by ID
 */
export const fetchContest = async (contestId: string): Promise<Contest> => {
  const response = await fetch(`${API_BASE}/contests/${contestId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch contest: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Create a new contest
 */
export const createContest = async (contestData: CreateContestRequest): Promise<Contest> => {
  const response = await fetch(`${API_BASE}/contests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add authentication header if needed
      // 'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(contestData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create contest: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Join a contest
 */
export const joinContest = async (contestId: string, walletAddress: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/contests/${contestId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add authentication header if needed
      // 'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) {
    throw new Error(`Failed to join contest: ${response.status} ${response.statusText}`);
  }
};

/**
 * Leave a contest
 */
export const leaveContest = async (contestId: string, walletAddress: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/contests/${contestId}/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add authentication header if needed
      // 'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) {
    throw new Error(`Failed to leave contest: ${response.status} ${response.statusText}`);
  }
};

/**
 * Submit game result to contest
 */
export const submitGameResult = async (
  contestId: string,
  gameData: {
    player1: string;
    player2: string;
    winner: string;
    result: 'win' | 'loss' | 'draw';
    gameId: string;
  }
): Promise<void> => {
  const response = await fetch(`${API_BASE}/contests/${contestId}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add authentication header if needed
      // 'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(gameData),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit game result: ${response.status} ${response.statusText}`);
  }
};

/**
 * Get contest leaderboard (top N players)
 */
export const fetchContestLeaderboard = async (
  contestId: string,
  limit: number = 50
): Promise<ContestStanding[]> => {
  const response = await fetch(`${API_BASE}/contests/${contestId}/leaderboard?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch contest leaderboard: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get player's contest statistics
 */
export const fetchPlayerContestStats = async (
  contestId: string,
  walletAddress: string
): Promise<{
  rank: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winRate: number;
}> => {
  const response = await fetch(
    `${API_BASE}/contests/${contestId}/players/${walletAddress}/stats`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch player contest stats: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
