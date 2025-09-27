import { Crown, Target, Gamepad2, Trophy, Zap, Users } from "lucide-react"

export const skills = [
  { icon: Crown, label: "Chess Masters Arena", description: "The ultimate test of strategy and intellect" },
  { icon: Target, label: "Carrom Champions", description: "Flick your way to victory in this classic board game" },
  {
    icon: Gamepad2,
    label: "Checkers Duel",
    description: "Jump your way to victory in this timeless strategy game",
  },
  { icon: Trophy, label: "Tournament Mode", description: "Compete in daily tournaments for glory and prizes" },
  {
    icon: Users,
    label: "Global Gaming Community",
    description: "Connect with players worldwide through competitive gaming",
  },
  {
    icon: Zap,
    label: "Quick Match System",
    description: "Find opponents instantly with our advanced matchmaking",
  },
]

export const achievements = [
  { number: "5K+", label: "Active Players" },
  { number: "50+", label: "Daily Tournaments" },
  { number: "2024", label: "Platform Launch" },
  { number: "99%", label: "Uptime Guarantee" },
]

export const careerTimeline = [
  {
    id: "1",
    title: "Platform Foundation",
    date: "2024 Q1",
    description: "Launched GameArena with chess as the flagship game",
    status: "completed" as const,
  },
  {
    id: "2",
    title: "Multi-Game Expansion",
    date: "2024 Q2",
    description: "Added carrom and checkers to the gaming arsenal",
    status: "completed" as const,
  },
  {
    id: "3",
    title: "Tournament System",
    date: "2024 Q3",
    description: "Introduced competitive tournaments and ranking system",
    status: "completed" as const,
  },
  {
    id: "4",
    title: "Community Features",
    date: "2024 Q4",
    description: "Added chat, spectator modes, and social features",
    status: "completed" as const,
  },
  {
    id: "5",
    title: "Mobile App Launch",
    date: "2025 Q1",
    description: "Cross-platform gaming with mobile app release",
    status: "current" as const,
  },
  {
    id: "6",
    title: "AI Training Partners",
    date: "2025 Q2",
    description: "Advanced AI opponents for skill development",
    status: "upcoming" as const,
  },
]
