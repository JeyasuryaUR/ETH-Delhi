'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/retroui/Button';
import { CreateTournamentDialog } from '@/components/chess/CreateTournamentDialog';
import { API_BASE } from '@/lib/config';

interface Tournament {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  prize_pool: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  created_at: string;
  _count?: {
    participants: number;
  };
}

export default function ContestPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch tournaments from API
  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching tournaments from backend...');
      
      const response = await fetch(API_BASE + '/contests');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch tournaments: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Handle the API response structure based on your backend
      if (data.success && data.data && data.data.contests) {
        setTournaments(data.data.contests);
        console.log('Tournaments loaded:', data.data.contests.length);
      } else if (data.success && Array.isArray(data.data)) {
        setTournaments(data.data);
        console.log('Tournaments loaded:', data.data.length);
      } else {
        console.warn('Unexpected API response structure:', data);
        setTournaments([]);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // Separate ongoing and upcoming tournaments
  const ongoingTournaments = tournaments.filter(tournament => {
    const now = new Date();
    const startDate = new Date(tournament.start_at);
    const endDate = new Date(tournament.end_at);
    return startDate <= now && endDate >= now;
  });

  const upcomingTournaments = tournaments.filter(tournament => {
    const now = new Date();
    const startDate = new Date(tournament.start_at);
    return startDate > now;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Convert prize pool to ETH display
  const formatPrizePool = (prizePool: string) => {
    const eth = parseFloat(prizePool);
    return eth.toFixed(2);
  };

  // Tournament card component
  const TournamentCard = ({ tournament }: { tournament: Tournament }) => {
    const isOngoing = ongoingTournaments.some(t => t.id === tournament.id);
    const prizePoolETH = formatPrizePool(tournament.prize_pool);

    const handleCardClick = () => {
      // Navigate to individual contest page
      router.push(`/dashboard/chess/contests/${tournament.id}`);
    };

    const handleButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click when button is clicked
      handleCardClick();
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="relative p-6 rounded-lg bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                isOngoing 
                  ? 'bg-green-500 text-white' 
                  : 'bg-[#FFE81E] text-black'
              }`}>
                {isOngoing ? 'Live Now' : 'Starting Soon'}
              </span>
              <span className="text-sm font-bold text-black">
                {isOngoing ? 'Ends:' : 'Starts:'} {formatDate(isOngoing ? tournament.end_at : tournament.start_at)}
              </span>
            </div>
            <h3 className="text-xl font-black text-black mb-2">{tournament.title}</h3>
            <div className="flex items-center space-x-4 text-sm font-bold text-black">
              <span>{tournament._count?.participants || 0} Players</span>
              <span>Prize: {prizePoolETH} ETH</span>
            </div>
          </div>
          <div className="text-right">
            {isOngoing ? (
              <Button size="sm" className="font-bold uppercase" onClick={handleButtonClick}>
                View Contest
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="font-bold uppercase" onClick={handleButtonClick}>
                View Contest
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const handleTournamentCreated = () => {
    // Close dialog and refresh tournaments list after creation
    setIsCreateDialogOpen(false);
    fetchTournaments();
  };

  return (
    <div className="">
      <div className="pb-12 pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-[#FFE81E] border-2 border-black rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h1 className="text-4xl font-black text-black uppercase">Tournaments</h1>
                  <p className="text-black font-bold">Compete, win, and claim your glory</p>
                </div>
              </div>
            </div>
            <Button 
              size="lg" 
              className="font-bold uppercase"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              Create Tournament
            </Button>
          </div>
          
          {/* Ongoing Tournaments */}
          {ongoingTournaments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10"
            >
              <h2 className="text-2xl font-black text-black mb-6 flex items-center space-x-2">
                <span className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></span>
                <span>Live Tournaments</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ongoingTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Upcoming Tournaments */}
          {upcomingTournaments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-black text-black mb-6">Upcoming Tournaments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </motion.div>
          )}

          {/* No Tournaments Message */}
          {tournaments.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-black text-black mb-2">No Tournaments Yet</h3>
              <p className="text-black font-bold">Be the first to create a tournament!</p>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-20">
              <div className="text-2xl font-black text-black">Loading tournaments...</div>
            </div>
          )}
        </div>
      </div>

      {/* Create Tournament Dialog */}
      <CreateTournamentDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onTournamentCreated={handleTournamentCreated}
      />
    </div>
  );
}