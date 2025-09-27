import express from 'express';
import { 
  createContest, 
  getContestById, 
  getAllContests,
  getUpcomingContests,
  getOngoingContests,
  joinContest,
  getContestParticipants
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

export default router;
