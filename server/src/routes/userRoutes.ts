import { Router } from 'express';
import { createUserProfile, getUserByWalletAddress, getUserGameHistory } from '../controllers/userController';

const router = Router();

// POST /api/users - create user profile
router.post('/', createUserProfile);

// GET /api/users/wallet/:wallet_address - get user by wallet address
router.get('/wallet/:wallet_address', getUserByWalletAddress);

// GET /api/users/wallet/:wallet_address/games - get user's game history
router.get('/wallet/:wallet_address/games', getUserGameHistory);

export default router;


