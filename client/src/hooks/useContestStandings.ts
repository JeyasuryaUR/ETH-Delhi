import { useState, useEffect, useCallback } from 'react';

// Types for contest standings
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

export interface ContestStandingsHook {
  contestData: ContestData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Custom hook for fetching contest standings data
 * @param contestId - The ID of the contest to fetch standings for
 * @returns Object containing contest data, loading state, error state, and refetch function
 */
export const useContestStandings = (contestId: string): ContestStandingsHook => {
  const [contestData, setContestData] = useState<ContestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContestStandings = useCallback(async (): Promise<void> => {
    if (!contestId) {
      setError('Contest ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use mock data for development
      // TODO: Replace with actual API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const mockData: ContestData = {
        contestId: 'contest-001',
        contestName: 'ETH Delhi Chess Championship',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-20T18:00:00Z',
        totalParticipants: 156,
        standings: [
          { rank: 1, ensAddress: 'chessmaster.eth', walletAddress: '0x1234...5678', rating: 2450, points: 28, wins: 14, losses: 0, draws: 0 },
          { rank: 2, ensAddress: 'grandmaster.eth', walletAddress: '0x2345...6789', rating: 2380, points: 26, wins: 13, losses: 1, draws: 0 },
          { rank: 3, ensAddress: 'strategist.eth', walletAddress: '0x3456...7890', rating: 2320, points: 24, wins: 12, losses: 2, draws: 0 },
          { rank: 4, ensAddress: 'kingmaker.eth', walletAddress: '0x4567...8901', rating: 2280, points: 22, wins: 11, losses: 3, draws: 0 },
          { rank: 5, ensAddress: 'pawnpusher.eth', walletAddress: '0x5678...9012', rating: 2250, points: 20, wins: 10, losses: 4, draws: 0 },
          { rank: 6, ensAddress: 'checkmate.eth', walletAddress: '0x6789...0123', rating: 2200, points: 18, wins: 9, losses: 5, draws: 0 },
          { rank: 7, ensAddress: 'bishop.eth', walletAddress: '0x7890...1234', rating: 2150, points: 16, wins: 8, losses: 6, draws: 0 },
          { rank: 8, ensAddress: 'knight.eth', walletAddress: '0x8901...2345', rating: 2100, points: 14, wins: 7, losses: 7, draws: 0 },
          { rank: 9, ensAddress: 'rook.eth', walletAddress: '0x9012...3456', rating: 2050, points: 12, wins: 6, losses: 8, draws: 0 },
          { rank: 10, ensAddress: 'queen.eth', walletAddress: '0x0123...4567', rating: 2000, points: 10, wins: 5, losses: 9, draws: 0 },
        ]
      };

      setContestData(mockData);

      // Uncomment this when API is ready:
      /*
      const response = await fetch(`${API_BASE_URL}/api/contests/${contestId}/standings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if needed
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch standings: ${response.status} ${response.statusText}`);
      }

      const data: ContestData = await response.json();
      
      // Validate the response data structure
      if (!data.contestId || !data.standings || !Array.isArray(data.standings)) {
        throw new Error('Invalid response data structure');
      }

      setContestData(data);
      */
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contest standings';
      setError(errorMessage);
      console.error('Error fetching contest standings:', err);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  useEffect(() => {
    fetchContestStandings();
  }, [fetchContestStandings]);

  return {
    contestData,
    loading,
    error,
    refetch: fetchContestStandings,
  };
};

/**
 * Utility function to fetch contest standings without using the hook
 * Useful for server-side rendering or one-off requests
 */
export const fetchContestStandingsDirect = async (contestId: string): Promise<ContestData> => {
  const response = await fetch(`${API_BASE_URL}/api/contests/${contestId}/standings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch standings: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Hook for real-time updates of contest standings
 * Uses WebSocket connection to get live updates
 */
export const useContestStandingsRealtime = (contestId: string): ContestStandingsHook => {
  const [contestData, setContestData] = useState<ContestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) {
      setError('Contest ID is required');
      setLoading(false);
      return;
    }

    // Initial fetch - using mock data for development
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Use mock data for development
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        const mockData: ContestData = {
          contestId: 'contest-001',
          contestName: 'ETH Delhi Chess Championship',
          startDate: '2024-01-15T10:00:00Z',
          endDate: '2024-01-20T18:00:00Z',
          totalParticipants: 156,
          standings: [
            { rank: 1, ensAddress: 'chessmaster.eth', walletAddress: '0x1234...5678', rating: 2450, points: 28, wins: 14, losses: 0, draws: 0 },
            { rank: 2, ensAddress: 'grandmaster.eth', walletAddress: '0x2345...6789', rating: 2380, points: 26, wins: 13, losses: 1, draws: 0 },
            { rank: 3, ensAddress: 'strategist.eth', walletAddress: '0x3456...7890', rating: 2320, points: 24, wins: 12, losses: 2, draws: 0 },
            { rank: 4, ensAddress: 'kingmaker.eth', walletAddress: '0x4567...8901', rating: 2280, points: 22, wins: 11, losses: 3, draws: 0 },
            { rank: 5, ensAddress: 'pawnpusher.eth', walletAddress: '0x5678...9012', rating: 2250, points: 20, wins: 10, losses: 4, draws: 0 },
            { rank: 6, ensAddress: 'checkmate.eth', walletAddress: '0x6789...0123', rating: 2200, points: 18, wins: 9, losses: 5, draws: 0 },
            { rank: 7, ensAddress: 'bishop.eth', walletAddress: '0x7890...1234', rating: 2150, points: 16, wins: 8, losses: 6, draws: 0 },
            { rank: 8, ensAddress: 'knight.eth', walletAddress: '0x8901...2345', rating: 2100, points: 14, wins: 7, losses: 7, draws: 0 },
            { rank: 9, ensAddress: 'rook.eth', walletAddress: '0x9012...3456', rating: 2050, points: 12, wins: 6, losses: 8, draws: 0 },
            { rank: 10, ensAddress: 'queen.eth', walletAddress: '0x0123...4567', rating: 2000, points: 10, wins: 5, losses: 9, draws: 0 },
          ]
        };
        
        setContestData(mockData);
        setError(null);
        
        // Uncomment when API is ready:
        /*
        const response = await fetch(`${API_BASE_URL}/api/contests/${contestId}/standings`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch standings: ${response.status}`);
        }

        const data: ContestData = await response.json();
        setContestData(data);
        setError(null);
        */
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load contest standings';
        setError(errorMessage);
        console.error('Error fetching contest standings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // WebSocket connection for real-time updates
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/contests/${contestId}/standings`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to contest standings WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const updatedData: ContestData = JSON.parse(event.data);
        setContestData(updatedData);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from contest standings WebSocket');
    };

    return () => {
      ws.close();
    };
  }, [contestId]);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use mock data for development
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const mockData: ContestData = {
        contestId: 'contest-001',
        contestName: 'ETH Delhi Chess Championship',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-20T18:00:00Z',
        totalParticipants: 156,
        standings: [
          { rank: 1, ensAddress: 'chessmaster.eth', walletAddress: '0x1234...5678', rating: 2450, points: 28, wins: 14, losses: 0, draws: 0 },
          { rank: 2, ensAddress: 'grandmaster.eth', walletAddress: '0x2345...6789', rating: 2380, points: 26, wins: 13, losses: 1, draws: 0 },
          { rank: 3, ensAddress: 'strategist.eth', walletAddress: '0x3456...7890', rating: 2320, points: 24, wins: 12, losses: 2, draws: 0 },
          { rank: 4, ensAddress: 'kingmaker.eth', walletAddress: '0x4567...8901', rating: 2280, points: 22, wins: 11, losses: 3, draws: 0 },
          { rank: 5, ensAddress: 'pawnpusher.eth', walletAddress: '0x5678...9012', rating: 2250, points: 20, wins: 10, losses: 4, draws: 0 },
          { rank: 6, ensAddress: 'checkmate.eth', walletAddress: '0x6789...0123', rating: 2200, points: 18, wins: 9, losses: 5, draws: 0 },
          { rank: 7, ensAddress: 'bishop.eth', walletAddress: '0x7890...1234', rating: 2150, points: 16, wins: 8, losses: 6, draws: 0 },
          { rank: 8, ensAddress: 'knight.eth', walletAddress: '0x8901...2345', rating: 2100, points: 14, wins: 7, losses: 7, draws: 0 },
          { rank: 9, ensAddress: 'rook.eth', walletAddress: '0x9012...3456', rating: 2050, points: 12, wins: 6, losses: 8, draws: 0 },
          { rank: 10, ensAddress: 'queen.eth', walletAddress: '0x0123...4567', rating: 2000, points: 10, wins: 5, losses: 9, draws: 0 },
        ]
      };
      
      setContestData(mockData);
      setError(null);
      
      // Uncomment when API is ready:
      /*
      const response = await fetch(`${API_BASE_URL}/api/contests/${contestId}/standings`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch standings: ${response.status}`);
      }

      const data: ContestData = await response.json();
      setContestData(data);
      setError(null);
      */
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contest standings';
      setError(errorMessage);
      console.error('Error fetching contest standings:', err);
    } finally {
      setLoading(false);
    }
  }, [contestId]);

  return {
    contestData,
    loading,
    error,
    refetch,
  };
};
