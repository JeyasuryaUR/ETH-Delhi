import { writeContract, readContract, waitForTransactionReceipt } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACTS, RIF_TOKEN, CONTEST_CONFIG } from '@/lib/contracts';
import { parseUnits, formatUnits } from 'viem';

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

export class PoolService {
  private publicClient: any;
  private walletClient: any;
  private account: any;

  constructor(publicClient: any, walletClient: any, account: any) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.account = account;
  }

  // Get RIF token balance for an address
  async getRIFBalance(address: string): Promise<bigint> {
    try {
      const balance = await readContract(this.publicClient, {
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
  }

  // Get RIF token allowance for Pool contract
  async getRIFAllowance(owner: string, spender: string): Promise<bigint> {
    try {
      const allowance = await readContract(this.publicClient, {
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
  }

  // Approve RIF tokens for Pool contract
  async approveRIF(amount: bigint): Promise<string> {
    try {
      const hash = await writeContract(this.walletClient, {
        address: CONTRACTS.RIF_TOKEN.ADDRESS as `0x${string}`,
        abi: CONTRACTS.RIF_TOKEN.ABI,
        functionName: 'approve',
        args: [CONTRACTS.POOL.ADDRESS as `0x${string}`, amount],
        account: this.account.address,
      });

      const receipt = await waitForTransactionReceipt(this.publicClient, {
        hash,
      });

      return hash;
    } catch (error) {
      console.error('Error approving RIF tokens:', error);
      throw error;
    }
  }

  // Create a new contest
  async createContest(prizePoolAmount: string, maxParticipants: number): Promise<string> {
    try {
      // Convert prize pool amount to wei
      const prizePoolWei = parseUnits(prizePoolAmount, RIF_TOKEN.DECIMALS);
      
      // First, approve the Pool contract to spend RIF tokens
      await this.approveRIF(prizePoolWei);

      // Create the contest
      const hash = await writeContract(this.walletClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'createContest',
        args: [BigInt(maxParticipants)],
        value: prizePoolWei, // This is the initial prize pool stake
        account: this.account.address,
      });

      const receipt = await waitForTransactionReceipt(this.publicClient, {
        hash,
      });

      return hash;
    } catch (error) {
      console.error('Error creating contest:', error);
      throw error;
    }
  }

  // Join a contest
  async joinContest(contestId: bigint): Promise<string> {
    try {
      // Get contest details to calculate staking amount
      const contestDetails = await this.getContestDetails(contestId);
      const stakingAmount = contestDetails.stakingAmount;

      // First, approve the Pool contract to spend RIF tokens
      await this.approveRIF(stakingAmount);

      // Join the contest
      const hash = await writeContract(this.walletClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'joinContest',
        args: [contestId],
        value: stakingAmount,
        account: this.account.address,
      });

      const receipt = await waitForTransactionReceipt(this.publicClient, {
        hash,
      });

      return hash;
    } catch (error) {
      console.error('Error joining contest:', error);
      throw error;
    }
  }

  // End a contest and distribute prizes
  async endContest(contestId: bigint, winners: [string, string, string]): Promise<string> {
    try {
      const hash = await writeContract(this.walletClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'endContest',
        args: [contestId, winners.map(w => w as `0x${string}`)],
        account: this.account.address,
      });

      const receipt = await waitForTransactionReceipt(this.publicClient, {
        hash,
      });

      return hash;
    } catch (error) {
      console.error('Error ending contest:', error);
      throw error;
    }
  }

  // Get contest details
  async getContestDetails(contestId: bigint): Promise<ContestDetails> {
    try {
      const details = await readContract(this.publicClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'getContestDetails',
        args: [contestId],
      });

      return {
        organizer: details[0],
        initialPrizePool: details[1],
        maxParticipants: details[2],
        participantCount: details[3],
        stakingAmount: details[4],
        isActive: details[5],
        isEnded: details[6],
        totalPrizePool: details[7],
      } as ContestDetails;
    } catch (error) {
      console.error('Error getting contest details:', error);
      throw error;
    }
  }

  // Get contest winners
  async getContestWinners(contestId: bigint): Promise<[string, string, string]> {
    try {
      const winners = await readContract(this.publicClient, {
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
  }

  // Check if user is participant in contest
  async isParticipant(contestId: bigint, userAddress: string): Promise<boolean> {
    try {
      const isParticipant = await readContract(this.publicClient, {
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
  }

  // Get total number of contests
  async getContestCounter(): Promise<bigint> {
    try {
      const counter = await readContract(this.publicClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'contestCounter',
      });

      return counter as bigint;
    } catch (error) {
      console.error('Error getting contest counter:', error);
      throw error;
    }
  }

  // Get contract balance
  async getContractBalance(): Promise<bigint> {
    try {
      const balance = await readContract(this.publicClient, {
        address: CONTRACTS.POOL.ADDRESS as `0x${string}`,
        abi: CONTRACTS.POOL.ABI,
        functionName: 'getContractBalance',
      });

      return balance as bigint;
    } catch (error) {
      console.error('Error getting contract balance:', error);
      throw error;
    }
  }

  // Calculate participant staking amount (1% of prize pool)
  calculateParticipantStake(prizePoolAmount: string): string {
    const prizePoolWei = parseUnits(prizePoolAmount, RIF_TOKEN.DECIMALS);
    const stakeWei = (prizePoolWei * BigInt(CONTEST_CONFIG.PARTICIPANT_STAKE_PERCENTAGE)) / BigInt(100);
    return formatUnits(stakeWei, RIF_TOKEN.DECIMALS);
  }

  // Calculate organizer reward (10% of total prize pool)
  calculateOrganizerReward(totalPrizePool: bigint): bigint {
    return (totalPrizePool * BigInt(CONTEST_CONFIG.ORGANIZER_REWARD_PERCENTAGE)) / BigInt(100);
  }

  // Calculate winner rewards (90% of total prize pool distributed among top 3)
  calculateWinnerRewards(totalPrizePool: bigint): [bigint, bigint, bigint] {
    const winnersShare = (totalPrizePool * BigInt(CONTEST_CONFIG.WINNERS_SHARE_PERCENTAGE)) / BigInt(100);
    
    // Distribute among top 3: 1st place gets 50%, 2nd place gets 30%, 3rd place gets 20%
    const firstPlace = (winnersShare * BigInt(50)) / BigInt(100);
    const secondPlace = (winnersShare * BigInt(30)) / BigInt(100);
    const thirdPlace = (winnersShare * BigInt(20)) / BigInt(100);

    return [firstPlace, secondPlace, thirdPlace];
  }
}

// Hook to use Pool service
export function usePoolService() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  if (!isConnected || !address || !publicClient || !walletClient) {
    return null;
  }

  return new PoolService(publicClient, walletClient, { address });
}
