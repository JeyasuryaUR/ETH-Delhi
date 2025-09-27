'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/retroui/Button';

export default function ChessDashboard() {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <div className="">
      <div className="pb-12 pt-32 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col mb-6 items-center">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-[#FFE81E] border-2 border-black rounded-lg flex items-center justify-center">
                <span className="text-2xl">♔</span>
              </div>
              <div>
                <h1 className="text-4xl font-black text-black uppercase">Chess Arena</h1>
                <p className="text-black font-bold">Master the game, conquer the board</p>
              </div>
            </div>
          </div>

          {/* Quick Play Section */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateTo('/dashboard/chess/play')}
            className="mb-8 p-8 rounded-lg border-2 border-black bg-[#FFE81E] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer group"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-black text-[#FFE81E] text-xs font-bold uppercase">Quick Match</span>
                  <span className="text-sm font-bold text-black uppercase">Fast & Fun</span>
                </div>
                <h2 className="text-2xl font-black text-black mb-2">Play Now</h2>
                <p className="text-black font-medium">Get matched with a random opponent instantly. Test your skills!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-bold text-black uppercase">Average Wait</div>
                  <div className="text-lg font-black text-black">~30s</div>
                </div>
                <Button size="lg" className="font-bold uppercase">
                  Start Game
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Game Options Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Challenge Friend */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 rounded-lg bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-not-allowed group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-xs font-bold uppercase mb-3">Coming Soon</span>
                  <h3 className="text-xl font-black text-black group-hover:text-gray-800">Challenge Friend</h3>
                  <p className="text-sm font-medium text-black mt-2">Invite specific opponents to private matches</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#FFE81E] border-2 border-black flex items-center justify-center">
                  <span className="text-lg">⚔️</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-black uppercase">Private Rooms</div>
                <Button variant="outline" size="sm" disabled className="font-bold uppercase">
                  Soon
                </Button>
              </div>
            </motion.div>

            {/* Tournaments */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigateTo('/dashboard/chess/contests')}
              className="p-6 rounded-lg bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FFE81E] text-black text-xs font-bold uppercase mb-3">Active</span>
                  <h3 className="text-xl font-black text-black group-hover:text-gray-800">Tournaments</h3>
                  <p className="text-sm font-medium text-black mt-2">Join competitive contests and win prizes</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#FFE81E] border-2 border-black flex items-center justify-center">
                  <span className="text-lg">🏆</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="text-xs font-bold text-black uppercase">Live Now</div>
                    <div className="text-sm font-black text-black">3 Active</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black uppercase">Prize Pool</div>
                    <div className="text-sm font-black text-black">$500+</div>
                  </div>
                </div>
                <Button size="sm" className="font-bold uppercase">
                  Enter
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-center">
                <div className="text-2xl font-black text-black">1,247</div>
                <div className="text-xs font-bold text-black uppercase">Games Played</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-center">
                <div className="text-2xl font-black text-black">856</div>
                <div className="text-xs font-bold text-black uppercase">Players Online</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-center">
                <div className="text-2xl font-black text-black">12</div>
                <div className="text-xs font-bold text-black uppercase">Tournaments</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-center">
                <div className="text-2xl font-black text-black">$2.5K</div>
                <div className="text-xs font-bold text-black uppercase">Total Prizes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}