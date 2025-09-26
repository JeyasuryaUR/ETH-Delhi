import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-24">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl blur-xl opacity-50"></div>
            <h1 className="relative text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 tracking-tight">
              PLAY
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Enter the future of gaming with premium blockchain experiences
          </p>
        </div>

        {/* Game Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Link href="#" className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
            <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:transform group-hover:-translate-y-2">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">♚</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Chess Arena</h3>
                <p className="text-gray-600 leading-relaxed">
                  Strategic battles with crypto rewards. Master the board, earn your victory.
                </p>
              </div>
            </div>
          </Link>

          <div className="group relative opacity-50 cursor-not-allowed">
            <div className="relative bg-white/60 backdrop-blur-sm border border-gray-200/30 rounded-3xl p-8 shadow-lg">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-500 mb-3">More Games</h3>
                <p className="text-gray-400 leading-relaxed">
                  New gaming experiences coming soon. Stay tuned for updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="text-center p-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <span className="text-lg">⚡</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Instant Play</h4>
            <p className="text-gray-600 text-sm">Connect wallet and start playing immediately</p>
          </div>

          <div className="text-center p-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <span className="text-lg">🏆</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Crypto Rewards</h4>
            <p className="text-gray-600 text-sm">Earn real cryptocurrency for your victories</p>
          </div>

          <div className="text-center p-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <span className="text-lg">🔒</span>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Secure Gaming</h4>
            <p className="text-gray-600 text-sm">Blockchain-powered fair play guarantee</p>
          </div>
        </div>
      </div>
    </div>
  );
}
