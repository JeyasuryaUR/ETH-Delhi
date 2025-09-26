'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ChessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen p-8">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.back()}
        className="mb-8 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
      >
        ← Back to Dashboard
      </motion.button>
      
      <h1 className="text-2xl font-semibold mb-8">Chess Game</h1>
      <div className="border border-gray-200 rounded-lg p-8 bg-white">
        <p className="text-gray-600">Chess game interface will be implemented here.</p>
      </div>
    </div>
  );
}
