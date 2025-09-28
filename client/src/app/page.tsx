"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/retro-button"
import { Play, Trophy } from "lucide-react"
import StudentGlobe from "@/components/globe-demo"
import { achievements } from "@/data/portfolio-data"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import Link from "next/link"

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  
  // Initialize client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  const { setShowAuthFlow } = useDynamicContext();

  const handleStartPlaying = () => {
    if (isClient && setShowAuthFlow) {
      setShowAuthFlow(true);
    }
  };

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-bold text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-background ">
      <section className="relative min-h-screen flex px-4 lg:px-8 bg-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mt-20 z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-8 mt-8">
              <div>
                <div className="inline-block mb-6">
                  <div className="bg-secondary text-secondary-foreground px-4 py-2 retro-border retro-shadow font-retro text-xs uppercase tracking-wider">
                    Blockchain Games Platform
                  </div>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-heading mb-6 text-foreground leading-tight">
                  <span className="block font-retro text-2xl md:text-3xl lg:text-4xl mb-2 text-primary">MASTER</span>
                  BATTLES
                </h1>

                <div className="bg-card retro-border retro-shadow p-6 mb-8 max-w-4xl">
                  <p className="text-lg md:text-xl text-card-foreground leading-relaxed font-medium">
                    CHALLENGE PLAYERS WORLDWIDE IN{" "}
                    <span className="bg-primary text-primary-foreground px-2 py-1 font-retro text-sm">
                      EPIC 1V1 BATTLES
                    </span>
                    <br />
                    <span className="font-retro text-sm mt-2 block text-muted-foreground">
                      FIDE RATINGS • ENS NAMES • DAO GOVERNANCE • NFT MATCHES
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8 py-6 font-bold uppercase tracking-wider" onClick={handleStartPlaying}>
                  <Play className="mr-2 h-5 w-5" />
                  Start Playing
                </Button>
                <Link href="/dashboard/chess/leaderboard">
                  <Button variant="secondary" size="lg" className="text-lg px-8 py-6 font-bold uppercase tracking-wider">
                    <Trophy className="mr-2 h-5 w-5" />
                    Leaderboard
                  </Button>
                </Link>
              </div>

              
            </div>
            

            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-card retro-border-thick retro-shadow-lg p-8 w-full aspect-square flex items-center justify-center">
                <StudentGlobe />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mt-10">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-card retro-border retro-shadow retro-shadow-hover p-4 text-center cursor-pointer"
                  >
                    <div className="text-2xl md:text-3xl font-black font-retro text-primary mb-2">
                      {achievement.number}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-card-foreground">
                      {achievement.label}
                    </div>
                  </div>
                ))}
              </div>
        </div>
        
      </section>
      

      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block mb-6">
                <div className="bg-secondary text-secondary-foreground px-6 py-3 retro-border retro-shadow font-retro text-sm uppercase tracking-wider">
                  Blockchain Features
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-black font-heading mb-6 text-foreground uppercase">
                Revolutionary Chess Platform with Blockchain Integration
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Experience chess like never before with{" "}
                <span className="bg-primary text-primary-foreground px-2 py-1 font-retro text-sm">
                  DECENTRALIZED RATING SYSTEMS
                </span>{" "}
                , ENS identities, DAO governance, and NFT match rewards. The future of competitive chess is here.
              </p>
            </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-card retro-border retro-shadow retro-shadow-hover p-8">
              <div className="flex items-center mb-4">
                <div className="bg-primary text-primary-foreground px-3 py-1 retro-border font-retro text-xs mr-4">
                  FIDE
                </div>
                <h3 className="text-2xl font-black font-heading text-primary uppercase">Multi-Source Rating System</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Integrated rating system combining FIDE, Lichess, and Chess.com data through blockchain oracles. 
                FIDE ratings hold the highest weight, ensuring authentic competitive rankings.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Your unified rating is stored on-chain with your ENS identity (user.chess.eth), creating a permanent 
                record of your chess journey and achievements.
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-retro mb-1">
                  <span>FIDE WEIGHT</span>
                  <span>60%</span>
                </div>
                <div className="bg-muted retro-border h-4">
                  <div className="bg-primary h-full w-3/5 retro-border-thin"></div>
                </div>
              </div>
            </div>

            <div className="bg-card retro-border retro-shadow retro-shadow-hover p-8">
              <div className="flex items-center mb-4">
                <div className="bg-secondary text-secondary-foreground px-3 py-1 retro-border font-retro text-xs mr-4">
                  DAO
                </div>
                <h3 className="text-2xl font-black font-heading text-primary uppercase">Decentralized Tournaments</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Stake-based tournaments with DAO governance. Participants vote on prize distribution, and the best 
                matches become NFT collectibles with royalty rewards for upvotes.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Secure match storage on blockchain with dual signatures, ensuring fair play and transparent 
                tournament management through community consensus.
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-xs font-retro mb-1">
                  <span>DAO CONSENSUS</span>
                  <span>60%+</span>
                </div>
                <div className="bg-muted retro-border h-4">
                  <div className="bg-primary h-full w-3/5 retro-border-thin"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary retro-border-thick retro-shadow-lg p-8 text-center">
            <div className="bg-primary-foreground text-primary px-4 py-2 retro-border font-retro text-xs uppercase tracking-wider inline-block mb-4">
              Investment & Growth
            </div>
            <h3 className="text-2xl font-black font-heading mb-4 text-primary-foreground uppercase">
              Player Investment System
            </h3>
            <p className="text-lg leading-relaxed max-w-3xl mx-auto text-primary-foreground">
              Invest in promising chess players and earn rewards from their victories. Support rising talents while 
              building a sustainable ecosystem where{" "}
              <span className="bg-primary-foreground text-primary px-2 py-1 font-retro text-sm">
                EVERYONE WINS
              </span>
              . Stake on players, share in their success, and help grow the chess community.
            </p>
          </div>
        </div>
      </section>

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
            <a href="#approach" className="text-muted-foreground hover:text-primary block duration-150">
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
