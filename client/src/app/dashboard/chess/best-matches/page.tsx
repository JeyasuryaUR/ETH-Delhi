"use client"
import { Button } from "@/components/ui/retro-button"
import { ArrowLeft, Trophy, Medal, Award, Crown, Target } from "lucide-react"
import Link from "next/link"

// Disable prerendering for this client-side page
export const dynamic = 'force-dynamic'

// Mock best matches data
const bestMatches = [
  {
    id: 1,
    image: "https://placehold.co/400x300",
    player1: {
      ens: "chessmaster.eth",
      rating: 2450,
      result: "won"
    },
    player2: {
      ens: "grandmaster.eth", 
      rating: 2380,
      result: "lost"
    },
    tournament: "World Championship Finals"
  },
  {
    id: 2,
    image: "https://placehold.co/400x300",
    player1: {
      ens: "strategist.eth",
      rating: 2320,
      result: "won"
    },
    player2: {
      ens: "kingmaker.eth",
      rating: 2280,
      result: "lost"
    },
    tournament: "Blockchain Chess Open"
  },
  {
    id: 3,
    image: "https://placehold.co/400x300",
    player1: {
      ens: "pawnpusher.eth",
      rating: 2250,
      result: "lost"
    },
    player2: {
      ens: "checkmate.eth",
      rating: 2200,
      result: "won"
    },
    tournament: "DAO Tournament #47"
  }
]

const getResultIcon = (result: string) => {
  if (result === "won") return <Crown className="h-4 w-4 text-yellow-500" />
  return <Target className="h-4 w-4 text-gray-400" />
}

const getResultColor = (result: string) => {
  if (result === "won") return "text-green-600 font-bold"
  return "text-red-600 font-bold"
}

export default function BestMatchesPage() {
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
                Epic Battles
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-heading mb-6 text-foreground leading-tight">
              <span className="block font-retro text-2xl md:text-3xl mb-2 text-primary">BEST</span>
              MATCHES
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Witness the most{" "}
              <span className="bg-primary text-primary-foreground px-2 py-1 font-retro text-sm">
                EPIC CHESS BATTLES
              </span>{" "}
              from around the world. These legendary matches have been immortalized as NFTs.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4 font-bold uppercase tracking-wider">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Matches Grid */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Trophy className="h-8 w-8 text-primary mr-3" />
              <h2 className="text-3xl font-black font-heading text-foreground uppercase">
                Legendary Matches
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These matches represent the pinnacle of strategic chess battles, featuring the world's best players.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bestMatches.map((match) => (
              <div
                key={match.id}
                className="bg-card retro-border-thick retro-shadow-lg hover:retro-shadow-hover transition-all duration-300 overflow-hidden"
              >
                {/* Match Image */}
                <div className="relative h-48 bg-muted/20 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center">
                      <Medal className="h-12 w-12 text-primary mx-auto mb-2" />
                      <p className="font-retro text-sm text-muted-foreground">Match #{match.id}</p>
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div className="p-6">
                  {/* Players */}
                  <div className="space-y-4 mb-6">
                    {/* Player 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getResultIcon(match.player1.result)}
                        <div>
                          <p className={`font-retro text-sm ${getResultColor(match.player1.result)}`}>
                            {match.player1.ens}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rating: {match.player1.rating}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-retro text-xs uppercase text-muted-foreground">
                          {match.player1.result.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* VS Divider */}
                    <div className="flex items-center justify-center">
                      <div className="h-px bg-border flex-1"></div>
                      <span className="px-3 font-retro text-xs text-muted-foreground">VS</span>
                      <div className="h-px bg-border flex-1"></div>
                    </div>

                    {/* Player 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getResultIcon(match.player2.result)}
                        <div>
                          <p className={`font-retro text-sm ${getResultColor(match.player2.result)}`}>
                            {match.player2.ens}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rating: {match.player2.rating}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-retro text-xs uppercase text-muted-foreground">
                          {match.player2.result.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tournament Name */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-retro text-xs uppercase tracking-wider text-muted-foreground">
                        Tournament
                      </span>
                    </div>
                    <p className="font-medium text-foreground text-sm">
                      {match.tournament}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    <Button 
                      size="sm" 
                      className="w-full font-retro text-xs uppercase tracking-wider"
                    >
                      View Match Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
