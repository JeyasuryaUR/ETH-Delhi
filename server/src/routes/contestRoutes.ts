import express from 'express';
import { 
  createContest, 
  getContestById, 
  getAllContests,
  getUpcomingContests,
  getOngoingContests,
  joinContest,
  getContestParticipants,
  startSwissTournament,
  startTournamentRound,
  completeTournamentRound,
  getTournamentStandings,
  completeSwissTournament,
  getTournamentRounds
} from '../controllers/contestController';

const router = express.Router();

// Create a new contest
router.post('/', createContest);

// Get upcoming contests (registration phase, not started yet)
router.get('/upcoming', getUpcomingContests);

// Get ongoing contests (active status, currently running)
router.get('/ongoing', getOngoingContests);

// Join a contest (for upcoming contests only)
router.post('/join', joinContest);

// Get participants of a specific contest
router.get('/:contestId/participants', getContestParticipants);

// Get contest by ID
router.get('/:id', getContestById);

// Get all contests with optional filtering
router.get('/', getAllContests);

// Swiss Tournament Management Routes
// Start a Swiss tournament
router.post('/:contestId/start-tournament', startSwissTournament);

// Start a tournament round
router.post('/:contestId/rounds/start', startTournamentRound);

// Complete a tournament round
router.post('/:contestId/rounds/complete', completeTournamentRound);

// Get tournament standings
router.get('/:contestId/standings', getTournamentStandings);

// Get tournament rounds
router.get('/:contestId/rounds', getTournamentRounds);

// Complete Swiss tournament
router.post('/:contestId/complete-tournament', completeSwissTournament);

export default router;
