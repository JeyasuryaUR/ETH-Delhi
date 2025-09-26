'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
    if (active) {
      router.push(`/dashboard/${gameId}`);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold mb-8">Games Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <motion.div
            key={game.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleGameClick(game.id, game.active)}
            className={`
              p-6 rounded-lg border cursor-pointer transition-colors duration-200
              ${game.active 
                ? 'border-black bg-white shadow-md' 
                : 'border-gray-200 bg-gray-50 opacity-60'
              }
            `}
          >
            <h2 className="text-xl font-medium">{game.name}</h2>
            <p className="text-sm text-gray-500 mt-2">
              {game.active ? 'Click to play' : 'Coming soon'}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
