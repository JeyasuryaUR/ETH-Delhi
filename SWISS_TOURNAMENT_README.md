# Swiss Tournament System for Chess Platform

## Overview

This implementation provides a complete Swiss tournament system for chess contests, including automatic pairing, scoring, tiebreaks, and rating management. The system supports multiple tournament types but focuses on Swiss tournaments with proper pairing algorithms.

## 🏗️ Architecture

### Backend (Node.js + Express + Prisma + PostgreSQL)
- **Database**: PostgreSQL with Prisma ORM
- **API**: RESTful endpoints for tournament management
- **Services**: Swiss pairing algorithm and tournament logic

### Frontend (Next.js + React + TypeScript)
- **UI Components**: Tournament management interface
- **State Management**: React hooks for real-time updates
- **API Integration**: Next.js API routes as proxy to backend

## 📊 Database Schema

### Core Tables

#### `contests`
```sql
- id (UUID, Primary Key)
- title (String)
- organizer_id (UUID, Foreign Key)
- type (String, default: 'standard')
- tournament_type (String, default: 'swiss')
- total_rounds (Integer, nullable)
- current_round (Integer, default: 0)
- round_duration (Integer, nullable)
- status (String, default: 'registration')
- start_at (DateTime, nullable)
- end_at (DateTime, nullable)
- prize_pool (Integer, default: 0)
- max_participants (Integer, default: 0)
- settings (JSON)
```

#### `contest_participants`
```sql
- id (UUID, Primary Key)
- contest_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- score (Decimal, default: 0)
- wins (Integer, default: 0)
- losses (Integer, default: 0)
- draws (Integer, default: 0)
- byes (Integer, default: 0)
- rating_at_start (Integer, nullable)
- rating_at_end (Integer, nullable)
- buchholz_score (Decimal, default: 0)
- sonneborn_berger (Decimal, default: 0)
```

#### `tournament_rounds`
```sql
- id (UUID, Primary Key)
- contest_id (UUID, Foreign Key)
- round_number (Integer)
- status (String, default: 'pending')
- start_at (DateTime, nullable)
- end_at (DateTime, nullable)
```

#### `games`
```sql
- id (UUID, Primary Key)
- contest_id (UUID, Foreign Key)
- round_id (UUID, Foreign Key)
- round_number (Integer, nullable)
- white_id (UUID, Foreign Key)
- black_id (UUID, Foreign Key)
- result (String, nullable)
- winner_id (UUID, Foreign Key)
- white_rating_before (Integer, nullable)
- black_rating_before (Integer, nullable)
- white_rating_after (Integer, nullable)
- black_rating_after (Integer, nullable)
```

## 🔧 API Endpoints

### Contest Management
- `POST /api/contests` - Create new contest
- `GET /api/contests` - Get all contests
- `GET /api/contests/:id` - Get contest by ID
- `POST /api/contests/join` - Join a contest

### Swiss Tournament Management
- `POST /api/contests/:id/start-tournament` - Start Swiss tournament
- `POST /api/contests/:id/rounds/start` - Start tournament round
- `POST /api/contests/:id/rounds/complete` - Complete tournament round
- `GET /api/contests/:id/standings` - Get tournament standings
- `GET /api/contests/:id/rounds` - Get tournament rounds
- `POST /api/contests/:id/complete-tournament` - Complete tournament

## 🎯 Swiss Pairing Algorithm

### How It Works

1. **Score Grouping**: Players are grouped by their current score
2. **Tiebreak Sorting**: Within each score group, players are sorted by:
   - Buchholz score (sum of opponents' scores)
   - Sonneborn-Berger score (weighted by opponent performance)
   - Rating (highest first)
3. **Pairing**: Players are paired within score groups, avoiding previous opponents
4. **Bye Handling**: Odd number of players results in one player getting a bye

### Key Features
- **Previous Opponent Avoidance**: Minimizes repeat pairings
- **Tiebreak Calculations**: Proper Swiss tournament tiebreaks
- **Bye Management**: Handles odd numbers of participants
- **Rating Integration**: Uses current ratings for pairing decisions

## 🏆 Scoring System

### Game Results
- **Win**: 1 point
- **Draw**: 0.5 points
- **Loss**: 0 points
- **Bye**: 1 point (automatic win)

### Tiebreak Methods
1. **Buchholz Score**: Sum of all opponents' scores
2. **Sonneborn-Berger Score**: Sum of (game score × opponent's score)
3. **Rating**: Highest rating wins

## 📈 Rating System

### Rating Updates
- **During Tournament**: Ratings are tracked but not updated
- **After Tournament**: All ratings are updated based on performance
- **ELO Calculation**: Simplified ELO with K-factor of 32

### Rating History
- All rating changes are logged in `ratings_history` table
- Includes tournament context and performance data

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Backend Setup
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Environment Variables
Create `.env` files in both `server/` and `client/` directories:

**server/.env**
```
DATABASE_URL="postgresql://username:password@localhost:5432/chess_tournament"
NODE_ENV="development"
```

**client/.env.local**
```
API_BASE_URL="http://localhost:8000"
```

## 📱 Usage Guide

### 1. Create a Contest
1. Navigate to `/dashboard/chess/contest`
2. Fill in contest details:
   - Title
   - Tournament type (Swiss recommended)
   - Number of rounds (5-7 recommended)
   - Prize pool
   - Start/end dates
   - Max participants
3. Submit the form

### 2. Manage Tournament
1. View contest at `/dashboard/chess/contest/[id]`
2. Wait for participants to join
3. Click "Start Swiss Tournament" when ready
4. For each round:
   - Click "Start Round X" to create pairings
   - Players play their games
   - Click "Complete Round X" when all games finish
5. Click "Complete Tournament" after final round

### 3. Monitor Progress
- **Standings**: Real-time tournament standings with tiebreaks
- **Rounds**: View all rounds and their games
- **Pairings**: Current round pairings and board assignments

## 🔍 Key Components

### Backend Services
- **SwissTournamentService**: Core tournament logic
- **ContestController**: API endpoints
- **Database Models**: Prisma schema definitions

### Frontend Components
- **SwissTournamentManager**: Main tournament interface
- **ContestViewPage**: Contest details and management
- **ContestCreationPage**: Contest setup form

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Run `npx prisma db push`

2. **API Connection Error**
   - Ensure backend server is running on port 8000
   - Check API_BASE_URL in client .env

3. **Tournament Not Starting**
   - Verify at least 2 participants have joined
   - Check contest status is 'registration'

4. **Pairing Issues**
   - Ensure all previous rounds are completed
   - Check for data consistency in database

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages in API responses.

## 📋 Tournament Flow

```
Registration Phase
    ↓
Start Tournament
    ↓
Round 1: Create Pairings → Play Games → Complete Round
    ↓
Round 2: Create Pairings → Play Games → Complete Round
    ↓
... (continue for all rounds)
    ↓
Complete Tournament → Update Ratings
```

## 🔧 Customization

### Adding New Tournament Types
1. Extend `tournament_type` enum in schema
2. Create new service class (e.g., `RoundRobinService`)
3. Add corresponding API endpoints
4. Update frontend components

### Modifying Pairing Algorithm
Edit `SwissTournamentService.pairPlayersInGroup()` method to implement custom pairing logic.

### Rating System Changes
Modify `calculateNewRating()` method in `SwissTournamentService` to implement different rating calculations.

## 📊 Performance Considerations

- **Database Indexes**: Optimized for common queries
- **Pagination**: Large participant lists are paginated
- **Caching**: Consider implementing Redis for frequently accessed data
- **Real-time Updates**: WebSocket integration recommended for live updates

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### Integration Tests
Test the complete tournament flow:
1. Create contest
2. Add participants
3. Start tournament
4. Complete rounds
5. Verify final standings

## 📝 License

This implementation is part of the ETH-Delhi chess platform project.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check database logs for errors
4. Create an issue with detailed error information
