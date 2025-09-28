import { useState, useEffect, useCallback } from 'react';
import { usePoolContract } from '@/hooks/usePoolContract';
import { ContestDetails, ContestInfo } from '@/hooks/usePoolContract';
import { formatUnits, parseUnits } from 'viem';
import { RIF_TOKEN, CONTRACTS } from '@/lib/contracts';

export interface ContestDisplayInfo extends ContestInfo {
  participantStake: string;
  totalPrizePoolFormatted: string;
  initialPrizePoolFormatted: string;
  participantCountFormatted: string;
  maxParticipantsFormatted: string;
  isParticipant: boolean;
}

export function useContests() {
  const poolContract = usePoolContract();
  const [contests, setContests] = useState<ContestDisplayInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all contests
  const fetchContests = useCallback(async () => {
    if (!poolContract.isConnected || !poolContract.address) return;

    setLoading(true);
    setError(null);

    try {
      const contestCounter = await poolContract.getContestCounter();
      const contestPromises: Promise<ContestDisplayInfo | null>[] = [];

      // Fetch details for each contest
      for (let i = 0; i < Number(contestCounter); i++) {
        const contestId = BigInt(i);
        
        const contestPromise = (async () => {
          try {
            const details = await poolContract.getContestDetails(contestId);
            const isParticipant = await poolContract.isParticipant(contestId, poolContract.address!);
            
            const participantStake = poolContract.calculateParticipantStake(
              formatUnits(details.initialPrizePool, RIF_TOKEN.DECIMALS)
            );

            return {
              contestId,
              organizer: details.organizer,
              initialPrizePool: details.initialPrizePool,
              totalPrizePool: details.totalPrizePool,
              maxParticipants: details.maxParticipants,
              participantCount: details.participantCount,
              isActive: details.isActive,
              isEnded: details.isEnded,
              participantStake,
              totalPrizePoolFormatted: formatUnits(details.totalPrizePool, RIF_TOKEN.DECIMALS),
              initialPrizePoolFormatted: formatUnits(details.initialPrizePool, RIF_TOKEN.DECIMALS),
              participantCountFormatted: details.participantCount.toString(),
              maxParticipantsFormatted: details.maxParticipants.toString(),
              isParticipant,
            } as ContestDisplayInfo;
          } catch (error) {
            console.error(`Error fetching contest ${i}:`, error);
            return null;
          }
        })();

        contestPromises.push(contestPromise);
      }

      const contestResults = await Promise.all(contestPromises);
      const validContests = contestResults.filter((contest): contest is ContestDisplayInfo => contest !== null);
      
      setContests(validContests);
    } catch (error) {
      console.error('Error fetching contests:', error);
      setError('Failed to fetch contests');
    } finally {
      setLoading(false);
    }
  }, [poolContract]);

  // Create a new contest
  const createContest = useCallback(async (prizePoolAmount: string, maxParticipants: number) => {
    if (!poolContract.isConnected) throw new Error('Wallet not connected');

    try {
      const txHash = await poolContract.createContest(prizePoolAmount, maxParticipants);
      
      // Refresh contests after creation
      await fetchContests();
      
      return txHash;
    } catch (error) {
      console.error('Error creating contest:', error);
      throw error;
    }
  }, [poolContract, fetchContests]);

  // Join a contest
  const joinContest = useCallback(async (contestId: bigint) => {
    if (!poolContract.isConnected) throw new Error('Wallet not connected');

    try {
      const txHash = await poolContract.joinContest(contestId);
      
      // Refresh contests after joining
      await fetchContests();
      
      return txHash;
    } catch (error) {
      console.error('Error joining contest:', error);
      throw error;
    }
  }, [poolContract, fetchContests]);

  // End a contest
  const endContest = useCallback(async (contestId: bigint, winners: [string, string, string]) => {
    if (!poolContract.isConnected) throw new Error('Wallet not connected');

    try {
      const txHash = await poolContract.endContest(contestId, winners);
      
      // Refresh contests after ending
      await fetchContests();
      
      return txHash;
    } catch (error) {
      console.error('Error ending contest:', error);
      throw error;
    }
  }, [poolContract, fetchContests]);

  // Get RIF balance
  const getRIFBalance = useCallback(async () => {
    if (!poolContract.isConnected || !poolContract.address) return '0';

    try {
      const balance = await poolContract.getRIFBalance(poolContract.address);
      return formatUnits(balance, RIF_TOKEN.DECIMALS);
    } catch (error) {
      console.error('Error getting RIF balance:', error);
      return '0';
    }
  }, [poolContract]);

  // Check RIF allowance
  const getRIFAllowance = useCallback(async () => {
    if (!poolContract.isConnected || !poolContract.address) return BigInt(0);

    try {
      return await poolContract.getRIFAllowance(
        poolContract.address,
        CONTRACTS.POOL.ADDRESS
      );
    } catch (error) {
      console.error('Error getting RIF allowance:', error);
      return BigInt(0);
    }
  }, [poolContract]);

  // Approve RIF tokens
  const approveRIF = useCallback(async (amount: string) => {
    if (!poolContract.isConnected) throw new Error('Wallet not connected');

    try {
      const amountWei = parseUnits(amount, RIF_TOKEN.DECIMALS);
      return await poolContract.approveRIF(amountWei);
    } catch (error) {
      console.error('Error approving RIF tokens:', error);
      throw error;
    }
  }, [poolContract]);

  // Load contests on mount
  useEffect(() => {
    if (poolContract.isConnected) {
      fetchContests();
    }
  }, [poolContract.isConnected, fetchContests]);

  return {
    contests,
    loading,
    error,
    createContest,
    joinContest,
    endContest,
    getRIFBalance,
    getRIFAllowance,
    approveRIF,
    refreshContests: fetchContests,
  };
}
