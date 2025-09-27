'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useUser } from '@/components/ClientWrapper';

interface Participant {
  id: string;
  user_id: string;
  score: number;
  joined_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    wallet_address: string;
    rating_cached: number;
  };
}

interface Contest {
  id: string;
  title: string;
  type: string;
  start_at: string;
  end_at: string;
  prize_pool: string;
  status: 'registration' | 'active' | 'completed';
  max_participants: number;
  current_round: number | null;
  organizer: {
    id: string;
    username: string;
    display_name: string;
    wallet_address: string;
  } | null;
  participants: Participant[];
  _count: {
    participants: number;
    games: number;
  };
}

export default function ContestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { primaryWallet, user } = useDynamicContext();
  const [contest, setContest] = useState<Contest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const contestId = params.id as string;

  // Fetch contest details
  const fetchContestDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:8000/api/contests/${contestId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contest details');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setContest(data.data);
        setParticipants(data.data.participants || []);
      }
    } catch (error) {
      console.error('Error fetching contest details:', error);
      // Redirect back to contests page if contest not found
      router.push('/dashboard/chess/contests');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch participants separately (for more control)
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/contests/${contestId}/participants`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.participants) {
          setParticipants(data.data.participants);
        }
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  useEffect(() => {
    if (contestId) {
      fetchContestDetails();
    }
  }, [contestId]);

  // Join contest function
  const handleJoinContest = async () => {
    if (!user || !primaryWallet) {
      alert('Please make sure you are logged in');
      return;
    }

    try {
      setIsJoining(true);
      const response = await fetch('http://localhost:8000/api/contests/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contestId: contestId,
          walletAddress: primaryWallet.address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh contest data to show updated participant list
        await fetchContestDetails();
        alert('Successfully joined the contest!');
      } else {
        alert(data.message || 'Failed to join contest');
      }
    } catch (error) {
      console.error('Error joining contest:', error);
      alert('Failed to join contest');
    } finally {
      setIsJoining(false);
    }
  };

  // Start contest function (for organizer)
  const handleStartContest = async () => {
    try {
      setIsStarting(true);
      const response = await fetch(`http://localhost:8000/api/contests/${contestId}/start-tournament`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh contest data to show updated status
        await fetchContestDetails();
        alert('Tournament started successfully!');
      } else {
        alert(data.message || 'Failed to start tournament');
      }
    } catch (error) {
      console.error('Error starting contest:', error);
      alert('Failed to start tournament');
    } finally {
      setIsStarting(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrizePool = (prizePool: string) => {
    const eth = parseFloat(prizePool);
    return eth.toFixed(4);
  };

  const isOrganizer = contest && primaryWallet && contest.organizer && 
    contest.organizer.wallet_address.toLowerCase() === primaryWallet.address.toLowerCase();

  const isUserParticipant = primaryWallet && participants.some(p => p.user.wallet_address === primaryWallet.address);

  const canJoin = contest && contest.status === 'registration' && !isUserParticipant && !isOrganizer;
  const canStart = contest && contest.status === 'registration' && isOrganizer && participants.length >= 2;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-black text-black">Loading contest...</div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-black text-black mb-2">Contest Not Found</h2>
          <p className="text-black font-bold mb-4">The contest you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard/chess/contests')}>
            Back to Contests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="outline" 
            className="mb-6"
            onClick={() => router.push('/dashboard/chess/contests')}
          >
            ← Back to Contests
          </Button>

          {/* Contest Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#FFE81E] border-2 border-black rounded-lg flex items-center justify-center">
                  <span className="text-3xl">🏆</span>
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black uppercase">{contest.title}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${
                      contest.status === 'registration' 
                        ? 'bg-[#FFE81E] text-black' 
                        : contest.status === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {contest.status === 'registration' ? 'Registration Open' : 
                       contest.status === 'active' ? 'Live Now' : 'Completed'}
                    </span>
                    {contest.organizer && (
                      <span className="text-sm font-bold text-gray-600">
                        Organized by {contest.organizer.display_name || contest.organizer.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                {canJoin && (
                  <Button 
                    size="lg"
                    onClick={handleJoinContest}
                    disabled={isJoining}
                    className="font-bold uppercase"
                  >
                    {isJoining ? 'Joining...' : 'Join Contest'}
                  </Button>
                )}
                
                {canStart && (
                  <Button 
                    size="lg"
                    onClick={handleStartContest}
                    disabled={isStarting}
                    className="font-bold uppercase bg-green-500 hover:bg-green-600"
                  >
                    {isStarting ? 'Starting...' : 'Start Contest'}
                  </Button>
                )}
                
                {isUserParticipant && contest.status === 'registration' && (
                  <Button variant="outline" size="lg" disabled className="font-bold uppercase">
                    Already Joined
                  </Button>
                )}
              </div>
            </div>

            {/* Contest Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-black">{formatPrizePool(contest.prize_pool)} ETH</div>
                <div className="text-sm font-bold text-gray-600">Prize Pool</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-black">{participants.length}/{contest.max_participants}</div>
                <div className="text-sm font-bold text-gray-600">Participants</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-black">{formatDate(contest.start_at)}</div>
                <div className="text-sm font-bold text-gray-600">Starts At</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-black">{formatDate(contest.end_at)}</div>
                <div className="text-sm font-bold text-gray-600">Ends At</div>
              </div>
            </div>
          </motion.div>

          {/* Participants List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <h2 className="text-2xl font-black text-black mb-6 flex items-center space-x-2">
                <span>👥</span>
                <span>Participants ({participants.length})</span>
              </h2>

              {participants.length > 0 ? (
                <div className="space-y-3">
                  {participants.map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-black transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-[#FFE81E] border-2 border-black rounded-full flex items-center justify-center">
                          <span className="font-black text-black">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-black text-black">
                            {participant.user.display_name || participant.user.username}
                          </div>
                          <div className="text-sm font-bold text-gray-600">
                            Rating: {participant.user.rating_cached || 'Unrated'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {contest.status !== 'registration' && (
                          <div className="font-black text-black">
                            Score: {participant.score}
                          </div>
                        )}
                        <div className="text-xs font-bold text-gray-500">
                          Joined {new Date(participant.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-black text-black mb-2">No Participants Yet</h3>
                  <p className="text-black font-bold">Be the first to join this tournament!</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}