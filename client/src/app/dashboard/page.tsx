'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/retroui/Button';
import { Trophy, Coins } from 'lucide-react';

// Disable prerendering for this client-side page
export const dynamic = 'force-dynamic';

const games = [
  { id: 'chess', name: 'Chess', active: true },
  { id: 'ping-pong', name: 'Ping Pong', active: false },
  { id: 'rocket-league', name: 'Rocket League', active: false },
  { id: 'carrom', name: 'Carrom', active: false },
  { id: 'pool', name: 'Pool', active: false },
  { id: 'squash', name: 'Squash', active: false },
];

export default function Dashboard() {
  const router = useRouter();

  const handleGameClick = (gameId: string, active: boolean) => {
    if (active && gameId === 'chess') {
      router.push(`/dashboard/chess`);
    } else if (active) {
      router.push(`/dashboard/${gameId}`);
    }
  };

  return (
    <div className="">
      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Contests Section */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/dashboard/contests')}
            className="mb-8 p-8 rounded-lg border-2 border-black bg-gradient-to-r from-purple-500 to-pink-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer group"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold uppercase">New</span>
                  <span className="text-sm font-bold text-white uppercase">Featured Feature</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Chess Contests
                </h2>
                <p className="text-white font-medium">Create and join tournaments with RIF token prizes on Rootstock!</p>
              </div>
              <Button size="lg" className="font-bold uppercase bg-white text-purple-600 hover:bg-gray-100">
                View Contests
              </Button>
            </div>
          </motion.div>

          {/* Featured Game */}
          {games.filter(game => game.active).map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGameClick(game.id, game.active)}
              className="mb-8 p-8 rounded-lg border-2 border-black bg-[#FFE81E] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-black text-[#FFE81E] text-xs font-bold uppercase">Active</span>
                    <span className="text-sm font-bold text-black uppercase">Featured Game</span>
                  </div>
                  <h2 className="text-2xl font-black text-black mb-2">{game.name}</h2>
                  <p className="text-black font-medium">Ready to play. Join now and start your gaming journey!</p>
                </div>
                <Button size="lg" className="font-bold uppercase">
                  Start Playing
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Other Games */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black text-black uppercase">Coming Soon</h2>
            <span className="text-sm font-bold text-black uppercase">5 Games in Development</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {games.filter(game => !game.active).map((game) => (
              <motion.div
                key={game.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="p-5 rounded-lg bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-not-allowed group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-xs font-bold uppercase mb-3">Coming Soon</span>
                    <h2 className="text-lg font-black text-black group-hover:text-gray-800">{game.name}</h2>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#FFE81E] border-2 border-black flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-black">Get ready for an exciting new gaming experience!</p>
                <div className="mt-4 flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-[#FFE81E] border-2 border-black flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-black"></span>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-black text-black uppercase">Join Waitlist</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
