# Contest Standings Page

A comprehensive final standings page for chess contests featuring a podium-style display and detailed rankings.

## Features

### 🏆 Podium Display

- **1st Place**: Center position with gold crown icon
- **2nd Place**: Left position with silver medal
- **3rd Place**: Right position with bronze medal
- Each podium card shows:
  - Player's ENS address
  - Rank, Rating, Points
  - Win-Loss-Draw record

### 📊 Top 10 Leaderboard

- Displays players ranked 4-10
- Columns: Rank, ENS Address, Rating, Points
- Responsive table design with hover effects

### 📈 Contest Statistics

- Total participants
- Highest score achieved
- Top rating in contest
- Overall win rate

## Usage

### Basic Implementation

```tsx
import ContestStandingsPage from "./page";

// The page will automatically fetch data using the contest ID
// Currently uses mock data for development
```

### API Integration

The page uses the `useContestStandings` hook for data fetching:

```tsx
import { useContestStandings } from "@/hooks/useContestStandings";

const { contestData, loading, error, refetch } = useContestStandings(contestId);
```

### Backend API Endpoints

The standings page expects the following API endpoints:

#### GET `/api/contests/:contestId/standings`

Returns complete contest standings data:

```json
{
  "contestId": "contest-001",
  "contestName": "ETH Delhi Chess Championship",
  "startDate": "2024-01-15T10:00:00Z",
  "endDate": "2024-01-20T18:00:00Z",
  "totalParticipants": 156,
  "standings": [
    {
      "rank": 1,
      "ensAddress": "chessmaster.eth",
      "walletAddress": "0x1234...5678",
      "rating": 2450,
      "points": 28,
      "wins": 14,
      "losses": 0,
      "draws": 0
    }
  ]
}
```

#### GET `/api/contests/:contestId/leaderboard?limit=50`

Returns leaderboard with optional limit.

#### GET `/api/contests/:contestId/players/:walletAddress/stats`

Returns individual player statistics.

## Customization

### Styling

The page uses the existing design system:

- Retro button components
- Consistent color scheme
- Responsive design
- Motion animations with Framer Motion

### Data Structure

Modify the `ContestStanding` and `ContestData` interfaces in:

- `client/src/hooks/useContestStandings.ts`
- `client/src/services/contestService.ts`

### Mock Data

For development, mock data is included in the standings page. Remove when connecting to real API:

```tsx
// Remove this when API is ready
const mockContestData: ContestData = { ... };
```

## Environment Variables

Set the API base URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Dependencies

- `framer-motion` - For animations
- `lucide-react` - For icons
- `@/components/ui/retro-button` - Custom button component

## Responsive Design

- **Mobile**: Stacked podium layout
- **Desktop**: Side-by-side podium layout
- **Table**: Horizontal scroll on small screens
- **Cards**: Responsive grid system

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live standings
2. **Export Functionality**: Download standings as PDF/CSV
3. **Player Profiles**: Click to view detailed player stats
4. **Prize Distribution**: Display prize information
5. **Historical Data**: Compare with previous contests
