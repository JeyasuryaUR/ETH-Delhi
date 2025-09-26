'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ChessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.back()}
            className="mb-6 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-sm transition-colors duration-200"
          >
            ← Back to Dashboard
          </motion.button>
          
          <h1 className="text-xl font-medium mb-6 text-gray-900">Chess Game</h1>
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <p className="text-gray-600">Chess game interface will be implemented here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
