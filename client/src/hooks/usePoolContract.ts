import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { readContract, writeContract, waitForTransactionReceipt } from 'viem/actions';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACTS, RIF_TOKEN, CONTEST_CONFIG } from '@/lib/contracts';

// Types for contest data
export interface ContestDetails {
  organizer: string;
  initialPrizePool: bigint;
  maxParticipants: bigint;
  participantCount: bigint;
  stakingAmount: bigint;
  isActive: boolean;
  isEnded: boolean;
  totalPrizePool: bigint;
}

export interface ContestInfo {
  contestId: bigint;
  organizer: string;
  initialPrizePool: bigint;
  totalPrizePool: bigint;
  maxParticipants: bigint;
  participantCount: bigint;
  isActive: boolean;
  isEnded: boolean;
}

export function usePoolContract() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Get ETH balance for an address
  const getETHBalance = async (address: string): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });
      return balance;
    } catch (error) {
      console.error('Error getting ETH balance:', error);
      throw error;
    }
  };

  // Get RIF token balance for an address
  const getRIFBalance = async (address: string): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const balance = await readContract(publicClient, {
        address: CONTRACTS.RIF_TOKEN.ADDRESS as `0x${string}`,
        abi: CONTRACTS.RIF_TOKEN.ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });
      return balance as bigint;
    } catch (error) {
      console.error('Error getting RIF balance:', error);
      throw error;
    }
  };

  // Get RIF token allowance for Pool contract
  const getRIFAllowance = async (owner: string, spender: string): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const allowance = await readContract(publicClient, {
        address: CONTRACTS.RIF_TOKEN.ADDRESS as `0x${string}`,
        abi: CONTRACTS.RIF_TOKEN.ABI,
        functionName: 'allowance',
        args: [owner as `0x${string}`, spender as `0x${string}`],
      });
      return allowance as bigint;
    } catch (error) {
      console.error('Error getting RIF allowance:', error);
      throw error;
    }
  };

  // Approve RIF tokens for Pool contract
  const approveRIF = async (amount: bigint): Promise<string> => {
    if (!walletClient || !address) throw new Error('Wallet client not available');
    
    try {
      const hash = await writeContract(walletClient, {
        address: CONTRACTS.RIF_TOKEN.ADDRESS as `0x${string}`,
        abi: CONTRACTS.RIF_TOKEN.ABI,
        functionName: 'approve',
        args: [CONTRACTS.POOL.ADDRESS as `0x${string}`, amount],
        account: address,
      });

      if (publicClient) {
        await waitForTransactionReceipt(publicClient, { hash });
      }

      return hash;
    } catch (error) {
      console.error('Error approving RIF tokens:', error);
      throw error;
    }
  };

  // Create a new contest
  const createContest = async (prizePoolAmount: string, maxParticipants: number): Promise<string> => {
    if (!walletClient || !address || !publicClient) throw new Error('Wallet client not available');
    
    try {
      // Convert prize pool amount to wei (ETH, not RIF)
      const prizePoolWei = parseUnits(prizePoolAmount, 18); // ETH has 18 decimals

      // Create the contest with ETH payment
      const hash = await writeContract(walletClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'createContest',
        args: [BigInt(maxParticipants)],
        value: prizePoolWei, // This is the initial prize pool stake in ETH
        account: address,
      });

      await waitForTransactionReceipt(publicClient, { hash });

      return hash;
    } catch (error) {
      console.error('Error creating contest:', error);
      throw error;
    }
  };

  // Join a contest
  const joinContest = async (contestId: bigint): Promise<string> => {
    if (!walletClient || !address || !publicClient) throw new Error('Wallet client not available');
    
    try {
      // Get contest details to calculate staking amount
      const contestDetails = await getContestDetails(contestId);
      const stakingAmount = contestDetails.stakingAmount;

      // Join the contest with ETH payment (1% of initial prize pool)
      const hash = await writeContract(walletClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'joinContest',
        args: [contestId],
        value: stakingAmount, // This is 1% of initial prize pool in ETH
        account: address,
      });

      await waitForTransactionReceipt(publicClient, { hash });

      return hash;
    } catch (error) {
      console.error('Error joining contest:', error);
      throw error;
    }
  };

  // End a contest and distribute prizes
  const endContest = async (contestId: bigint, winners: [string, string, string]): Promise<string> => {
    if (!walletClient || !address || !publicClient) throw new Error('Wallet client not available');
    
    try {
      const hash = await writeContract(walletClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'endContest',
        args: [contestId, winners.map(w => w as `0x${string}`)],
        account: address,
      });

      await waitForTransactionReceipt(publicClient, { hash });

      return hash;
    } catch (error) {
      console.error('Error ending contest:', error);
      throw error;
    }
  };

  // Get contest details
  const getContestDetails = async (contestId: bigint): Promise<ContestDetails> => {
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const details = await readContract(publicClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'getContestDetails',
        args: [contestId],
      });

      return {
        organizer: (details as any)[0],
        initialPrizePool: (details as any)[1],
        maxParticipants: (details as any)[2],
        participantCount: (details as any)[3],
        stakingAmount: (details as any)[4],
        isActive: (details as any)[5],
        isEnded: (details as any)[6],
        totalPrizePool: (details as any)[7],
      } as ContestDetails;
    } catch (error) {
      console.error('Error getting contest details:', error);
      throw error;
    }
  };

  // Get contest winners
  const getContestWinners = async (contestId: bigint): Promise<[string, string, string]> => {
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const winners = await readContract(publicClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'getContestWinners',
        args: [contestId],
      });

      return winners as [string, string, string];
    } catch (error) {
      console.error('Error getting contest winners:', error);
      throw error;
    }
  };

  // Check if user is participant in contest
  const isParticipant = async (contestId: bigint, userAddress: string): Promise<boolean> => {
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const isParticipant = await readContract(publicClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'isParticipant',
        args: [contestId, userAddress as `0x${string}`],
      });

      return isParticipant as boolean;
    } catch (error) {
      console.error('Error checking participant status:', error);
      throw error;
    }
  };

  // Get total number of contests
  const getContestCounter = async (): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const counter = await readContract(publicClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'contestCounter',
        args: [],
      });

      return counter as bigint;
    } catch (error) {
      console.error('Error getting contest counter:', error);
      throw error;
    }
  };

  // Get contract balance
  const getContractBalance = async (): Promise<bigint> => {
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const balance = await readContract(publicClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'getContractBalance',
        args: [],
      });

      return balance as bigint;
    } catch (error) {
      console.error('Error getting contract balance:', error);
      throw error;
    }
  };

  // Calculate participant staking amount (1% of prize pool)
  const calculateParticipantStake = (prizePoolAmount: string): string => {
    const prizePoolWei = parseUnits(prizePoolAmount, 18); // ETH has 18 decimals
    const stakeWei = (prizePoolWei * BigInt(CONTEST_CONFIG.PARTICIPANT_STAKE_PERCENTAGE)) / BigInt(100);
    return formatUnits(stakeWei, 18); // ETH has 18 decimals
  };

  // Calculate organizer reward (10% of total prize pool)
  const calculateOrganizerReward = (totalPrizePool: bigint): bigint => {
    return (totalPrizePool * BigInt(CONTEST_CONFIG.ORGANIZER_REWARD_PERCENTAGE)) / BigInt(100);
  };

  // Calculate winner rewards (90% of total prize pool distributed among top 3)
  const calculateWinnerRewards = (totalPrizePool: bigint): [bigint, bigint, bigint] => {
    const winnersShare = (totalPrizePool * BigInt(CONTEST_CONFIG.WINNERS_SHARE_PERCENTAGE)) / BigInt(100);
    
    // Distribute among top 3: 1st place gets 50%, 2nd place gets 30%, 3rd place gets 20%
    const firstPlace = (winnersShare * BigInt(50)) / BigInt(100);
    const secondPlace = (winnersShare * BigInt(30)) / BigInt(100);
    const thirdPlace = (winnersShare * BigInt(20)) / BigInt(100);

    return [firstPlace, secondPlace, thirdPlace];
  };

  return {
    isConnected,
    address,
    getETHBalance,
    getRIFBalance,
    getRIFAllowance,
    approveRIF,
    createContest,
    joinContest,
    endContest,
    getContestDetails,
    getContestWinners,
    isParticipant,
    getContestCounter,
    getContractBalance,
    calculateParticipantStake,
    calculateOrganizerReward,
    calculateWinnerRewards,
  };
}
