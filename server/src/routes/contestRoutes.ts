import express from 'express';
import { createContest, getContestById, getAllContests } from '../controllers/contestController';

const router = express.Router();

// Create a new contest
router.post('/', createContest);

// Get contest by ID
router.get('/:id', getContestById);

// Get all contests with optional filtering
router.get('/', getAllContests);

export default router;
