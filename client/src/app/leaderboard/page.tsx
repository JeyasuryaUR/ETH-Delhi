"use client"
import { Button } from "@/components/ui/retro-button"
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react"
import Link from "next/link"

// Fix for JSX table elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      thead: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>
      tbody: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>
      th: React.DetailedHTMLProps<React.ThHTMLAttributes<HTMLTableHeaderCellElement>, HTMLTableHeaderCellElement>
      td: React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>
      tr: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>
      table: React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>
    }
  }
}

// Mock leaderboard data - replace with actual data from your API
const leaderboardData = [
  { rank: 1, ensAddress: "chessmaster.eth", rating: 2450 },
  { rank: 2, ensAddress: "grandmaster.eth", rating: 2380 },
  { rank: 3, ensAddress: "strategist.eth", rating: 2320 },
  { rank: 4, ensAddress: "kingmaker.eth", rating: 2280 },
  { rank: 5, ensAddress: "pawnpusher.eth", rating: 2250 },
  { rank: 6, ensAddress: "checkmate.eth", rating: 2200 },
  { rank: 7, ensAddress: "bishop.eth", rating: 2150 },
  { rank: 8, ensAddress: "knight.eth", rating: 2100 },
  { rank: 9, ensAddress: "rook.eth", rating: 2050 },
  { rank: 10, ensAddress: "queen.eth", rating: 2000 },
  { rank: 11, ensAddress: "pawn.eth", rating: 1950 },
  { rank: 12, ensAddress: "gambit.eth", rating: 1900 },
  { rank: 13, ensAddress: "opening.eth", rating: 1850 },
  { rank: 14, ensAddress: "endgame.eth", rating: 1800 },
  { rank: 15, ensAddress: "tactician.eth", rating: 1750 },
]

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Medal className="h-6 w-6 text-yellow-500" />
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
  return <span className="text-lg font-bold text-foreground">#{rank}</span>
}

const getRankColor = (rank: number) => {
  if (rank <= 3) return "bg-primary text-primary-foreground"
  if (rank <= 10) return "bg-secondary text-secondary-foreground"
  return "bg-card text-card-foreground"
}

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="relative py-20 px-4 lg:px-8 overflow-hidden bg-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto mt-10">
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="bg-secondary text-secondary-foreground px-6 py-3 retro-border retro-shadow font-retro text-sm uppercase tracking-wider">
                Competition Rankings
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-heading mb-6 text-foreground leading-tight">
              <span className="block font-retro text-2xl md:text-3xl mb-2 text-primary">GLOBAL</span>
              LEADERBOARD
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              See how you stack up against the{" "}
              <span className="bg-primary text-primary-foreground px-2 py-1 font-retro text-sm">
                BEST PLAYERS
              </span>{" "}
              in the world. Climb the ranks and prove your strategic mastery.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <Link href="/">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4 font-bold uppercase tracking-wider">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Leaderboard Table Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card retro-border-thick retro-shadow-lg p-8">
            <div className="flex items-center justify-center mb-8">
              <Trophy className="h-8 w-8 text-primary mr-3" />
              <h2 className="text-3xl font-black font-heading text-foreground uppercase">
                Top Players
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-4 px-6 font-retro text-sm uppercase tracking-wider text-foreground">
                      Rank
                    </th>
                    <th className="text-left py-4 px-6 font-retro text-sm uppercase tracking-wider text-foreground">
                      ENS Address
                    </th>
                    <th className="text-left py-4 px-6 font-retro text-sm uppercase tracking-wider text-foreground">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((player, index) => (
                    <tr
                      key={player.rank}
                      className={`border-b border-gray-200 hover:bg-muted/50 transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-muted/20"
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {getRankIcon(player.rank)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${getRankColor(player.rank)} flex items-center justify-center font-retro text-xs`}>
                            {player.ensAddress.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground font-retro text-sm">
                            {player.ensAddress}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          <span className="font-bold text-foreground font-retro text-sm">
                            {player.rating}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              <div className="bg-primary retro-border retro-shadow p-6">
                <h3 className="text-xl font-black font-heading mb-2 text-primary-foreground uppercase">
                  Ready to Compete?
                </h3>
                <p className="text-primary-foreground mb-4">
                  Start playing and climb your way to the top of the leaderboard!
                </p>
                <Link href="/">
                  <Button size="lg" className="text-lg px-8 py-4 font-bold uppercase tracking-wider bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                    Start Playing Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 md:py-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(226, 232, 240, 0.5) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(226, 232, 240, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "20px 30px",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 100%, #000 60%, transparent 100%)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold font-heading text-primary mb-2">GameArena</h3>
            <p className="text-muted-foreground">Master of Strategy Games</p>
          </div>

          <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
            <a href="#about" className="text-muted-foreground hover:text-primary block duration-150">
              <span>Games</span>
            </a>
            <a href="#expertise" className="text-muted-foreground hover:text-primary block duration-150">
              <span>Tournaments</span>
            </a>
            <a href="/leaderboard" className="text-muted-foreground hover:text-primary block duration-150">
              <span>Leaderboard</span>
            </a>
            <a
              href="mailto:support@gamearena.com"
              className="text-muted-foreground hover:text-primary block duration-150"
            >
              <span>Support</span>
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary block duration-150"
            >
              <span>Community</span>
            </a>
          </div>

          <span className="block text-center text-sm text-yellow-400 font-semibold">
            © {new Date().getFullYear()} GameArena. Where Strategy Meets Competition.
          </span>
        </div>
      </footer>
    </div>
  )
}
