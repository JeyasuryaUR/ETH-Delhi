# Chess.fun ♟️

<div align="center">

![Chess.fun Logo](https://img.shields.io/badge/Chess.fun-♟️-blue?style=for-the-badge&logo=chess)

**A decentralized protocol that unifies chess ratings on-chain, powers stake-based contests, enables spectator betting, and mints verified match NFTs mapped to ENS identities.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=flat&logo=ethereum&logoColor=white)](https://ethereum.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

## 🎯 Overview

Chess.fun revolutionizes competitive chess by creating a unified, decentralized platform that bridges traditional chess ratings with blockchain technology. Players can compete in tournaments, prove their skills on-chain, and participate in a new economy around chess excellence.

### 🚨 The Problem

- **Fragmented Ratings**: FIDE, Lichess, and Chess.com ratings exist in isolation
- **Untampered Records**: Match results stored off-chain can be manipulated
- **Centralized Tournaments**: Lack standardized prize distribution and governance
- **Limited Fan Engagement**: Spectator betting and interaction opportunities are underdeveloped

### ✨ The Solution

Chess.fun provides:
- **Unified On-Chain Rating System** powered by Chainlink oracles
- **ENS Identity Layer** with chess.eth subdomains
- **Tamper-Proof Match Records** using EIP-712 signatures and Walrus storage
- **DAO-Governed Contests** with automated prize distribution
- **Spectator Markets** and fan engagement features
- **NFT Match Records** for memorable games

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        A[Chess Dashboard] --> B[Tournament Manager]
        A --> C[Rating Display]
        A --> D[ENS Registration]
        B --> E[Swiss Tournament]
        B --> F[Contest Creation]
    end
    
    subgraph "Backend (Node.js + Express)"
        G[API Routes] --> H[Contest Service]
        G --> I[Rating Service]
        G --> J[Socket.IO Chess]
        H --> K[Swiss Algorithm]
        I --> L[Walrus Integration]
    end
    
    subgraph "Blockchain Layer"
        M[SubdomainIssuer.sol] --> N[ENS Registry]
        O[Ratings.sol] --> P[On-chain Ratings]
        Q[Chainlink Oracles] --> P
    end
    
    subgraph "External Services"
        R[FIDE API] --> Q
        S[Lichess API] --> Q
        T[Chess.com API] --> Q
        U[Walrus Storage] --> L
    end
    
    A --> G
    G --> M
    I --> Q
    L --> U
```

## 🌟 Key Features

### 🏆 Tournament System
- **Swiss Tournament Algorithm**: Intelligent pairing system with proper scoring
- **Multiple Time Controls**: Blitz, bullet, classical formats
- **Real-time Updates**: Live tournament standings and pairings
- **Automated Prize Distribution**: Smart contract-based payouts

### 🔗 Blockchain Integration
- **ENS Subdomains**: Players get `username.chess.eth` identities
- **On-chain Ratings**: Unified rating system across platforms
- **Match Verification**: EIP-712 signatures for game consent
- **Decentralized Storage**: Walrus integration for PGN archives

### 🎮 Chess Engine
- **Real-time Multiplayer**: Socket.IO-powered chess games
- **Move Validation**: Chess.js integration for legal moves
- **Game State Management**: Persistent game history
- **Spectator Mode**: Watch live games with analysis

### 📊 Rating Aggregation
- **Multi-platform Fetching**: FIDE, Lichess, Chess.com APIs
- **Weighted Formula**: FIDE > Lichess > Chess.com priority
- **Oracle Updates**: Chainlink Functions for trustless data
- **Historical Tracking**: Rating progression over time

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Foundry (for smart contracts)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/JeyasuryaUR/ETH-Delhi.git
cd ETH-Delhi
```

### 2. Environment Setup

#### Client Environment
```bash
cd client
cp .env.example .env.local
```

```env
# .env.local
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
```

#### Server Environment
```bash
cd ../server
cp .env.example .env
```

```env
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/chess_db"
PORT=8000
WALRUS_API_BASE=https://walrus-testnet.blockscope.com
QUILT_PATCH_API_BASE=https://your-quilt-patch-api.com
```

### 3. Database Setup

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install

# Install contract dependencies
cd ../contracts
forge install
```

### 5. Smart Contract Deployment

```bash
cd contracts
forge build

# Deploy to testnet (update script with your addresses)
forge script script/WrapAndMint.s.sol --rpc-url sepolia --broadcast --verify
```

### 6. Start Development Servers

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.5.4 with React 19
- **Styling**: TailwindCSS with custom retro UI components
- **Web3**: Dynamic Labs, Wagmi, Viem
- **Chess Engine**: Chess.js for move validation
- **3D Graphics**: Three.js with React Three Fiber
- **Real-time**: Socket.IO client

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO for chess games
- **Storage**: Walrus for decentralized PGN storage
- **Authentication**: JWT with Dynamic Labs integration

### Blockchain
- **Smart Contracts**: Solidity 0.8.18
- **Development**: Foundry framework
- **Identity**: ENS subdomain issuer
- **Oracles**: Chainlink Functions (planned)
- **Networks**: Ethereum, Polygon (multi-chain ready)

### External Integrations
- **Rating APIs**: FIDE, Lichess, Chess.com
- **Decentralized Storage**: Walrus platform
- **Identity**: ENS (Ethereum Name Service)
- **Oracles**: Chainlink for rating aggregation

## 📁 Project Structure

```
ETH-Delhi/
├── 📁 client/                    # Next.js frontend application
│   ├── 📁 src/
│   │   ├── 📁 app/              # Next.js app router
│   │   │   ├── 📁 api/          # API route handlers
│   │   │   ├── 📁 dashboard/    # Chess dashboard pages
│   │   │   │   └── 📁 chess/    # Chess-specific routes
│   │   │   └── 📁 create/       # Tournament creation
│   │   ├── 📁 components/       # React components
│   │   │   ├── 📁 chess/        # Chess-specific components
│   │   │   ├── 📁 retroui/      # Custom UI components
│   │   │   └── 📁 ui/           # Base UI components
│   │   ├── 📁 hooks/            # Custom React hooks
│   │   ├── 📁 services/         # API service layers
│   │   └── 📁 types/            # TypeScript definitions
│   └── 📄 package.json
│
├── 📁 server/                    # Node.js backend server
│   ├── 📁 src/
│   │   ├── 📁 controllers/      # Request handlers
│   │   ├── 📁 routes/           # API route definitions
│   │   ├── 📁 services/         # Business logic
│   │   │   └── swissTournamentService.ts  # Swiss pairing algorithm
│   │   ├── 📁 socket/           # Socket.IO handlers
│   │   └── 📁 lib/              # Database and utilities
│   ├── 📁 prisma/               # Database schema and migrations
│   └── 📄 package.json
│
├── 📁 contracts/                 # Smart contracts (Foundry)
│   ├── 📁 src/
│   │   ├── SubdomainIssuer.sol  # ENS subdomain management
│   │   └── Ratings.sol          # On-chain rating registry
│   ├── 📁 script/               # Deployment scripts
│   └── 📄 foundry.toml
│
└── 📄 Documentation files
    ├── CHESS_IMPLEMENTATION.md   # Chess system details
    ├── SWISS_TOURNAMENT_README.md # Tournament system guide
    └── WALRUS_INTEGRATION.md     # Walrus storage integration
```

## 🎮 Core Features Deep Dive

### Swiss Tournament System

The platform implements a sophisticated Swiss tournament system with:

- **Intelligent Pairing Algorithm**: Matches players of similar scores while avoiding repeat pairings
- **Tiebreaker Systems**: Buchholz and Sonneborn-Berger scoring
- **Flexible Round Management**: Variable round counts based on participant size
- **Real-time Updates**: Live standings and pairing generation

```typescript
// Example: Creating a Swiss tournament
const tournament = await createTournament({
  title: "ETH-Delhi Championship",
  type: "blitz",
  tournamentType: "swiss",
  maxParticipants: 32,
  timeControl: "5+3",
  prizePool: 1000 // in tokens
});
```

### Rating Aggregation

Multi-platform rating integration with weighted scoring:

```typescript
// Rating calculation formula
const unifiedRating = (
  fideRating * 0.5 +      // FIDE: 50% weight
  lichessRating * 0.3 +   // Lichess: 30% weight
  chessComRating * 0.2    // Chess.com: 20% weight
);
```

### ENS Integration

Players receive chess.eth subdomains linked to their profiles:

```solidity
// Subdomain registration
function registerUsername(string calldata label, address owner) external {
    // Register username.chess.eth → owner
    wrapper.setSubnodeRecord(
        parentNode,
        label,
        owner,
        resolver,
        0,
        fuses,
        expiry
    );
}
```

## 🔗 API Documentation

### Contest Management

```http
GET    /api/contests              # List all contests
POST   /api/contests              # Create new contest
GET    /api/contests/{id}         # Get contest details
POST   /api/contests/{id}/join    # Join contest
POST   /api/contests/{id}/start-tournament  # Start tournament
```

### Tournament Operations

```http
GET    /api/contests/{id}/rounds         # Get tournament rounds
POST   /api/contests/{id}/rounds/start   # Start new round
POST   /api/contests/{id}/rounds/complete # Complete current round
GET    /api/contests/{id}/standings      # Get current standings
```

### Rating System

```http
POST   /api/ratings/store          # Store ratings in Walrus
GET    /api/ratings/retrieve/{id}  # Retrieve stored ratings
POST   /api/ratings/getRating      # Fetch current ratings
```

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests  
cd client
npm test

# Smart contract tests
cd contracts
forge test

# Integration test for Walrus
cd server
node test-walrus-integration.js
```

### Test Coverage

- ✅ Swiss tournament pairing algorithm
- ✅ Rating aggregation and storage
- ✅ ENS subdomain registration
- ✅ Real-time chess game functionality
- ✅ Walrus integration for data storage

## 🚀 Deployment

### Frontend Deployment (Vercel)

```bash
cd client
vercel --prod
```

### Backend Deployment (Railway/Render)

```bash
cd server
npm run build
npm start
```

### Smart Contract Deployment

```bash
cd contracts
forge script script/WrapAndMint.s.sol --rpc-url mainnet --broadcast --verify
```

### Environment Variables for Production

```env
# Production environment
DATABASE_URL=postgresql://prod_user:password@prod_host:5432/chess_prod
WALRUS_API_BASE=https://walrus-mainnet.blockscope.com
CHAINLINK_ORACLE_ADDRESS=0x...
ENS_RESOLVER_ADDRESS=0x...
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Document public APIs

## 🗺️ Roadmap

### Phase 1: Core Platform ✅
- [x] Chess game engine with real-time multiplayer
- [x] Swiss tournament system
- [x] ENS subdomain registration
- [x] Basic rating aggregation

### Phase 2: Enhanced Features 🚧
- [ ] Chainlink oracle integration
- [ ] DAO governance for disputes
- [ ] NFT minting for best matches
- [ ] Spectator betting markets

### Phase 3: Advanced Features 🔮
- [ ] Cross-chain tournament support
- [ ] AI-powered game analysis
- [ ] Streaming integration
- [ ] Mobile application

### Phase 4: Ecosystem Growth 🌱
- [ ] Tournament sponsorship system
- [ ] Coach certification program
- [ ] Educational content platform
- [ ] Partnership integrations

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chess.js** for move validation and PGN handling
- **Dynamic Labs** for Web3 authentication
- **Walrus** for decentralized storage
- **ENS** for decentralized identity
- **Chainlink** for oracle services
- **ETH Global** for hackathon inspiration

## 📞 Support & Contact

- **Discord**: [Join our community](https://discord.gg/chess-fun)
- **Twitter**: [@ChessFunWeb3](https://twitter.com/ChessFunWeb3)
- **Email**: team@chess.fun
- **GitHub Issues**: [Report bugs](https://github.com/JeyasuryaUR/ETH-Delhi/issues)

---

<div align="center">

**Built with ❤️ for the chess community and Web3 ecosystem**

[Website](https://chess.fun) • [Docs](https://docs.chess.fun) • [Discord](https://discord.gg/chess-fun) • [Twitter](https://twitter.com/ChessFunWeb3)

</div>