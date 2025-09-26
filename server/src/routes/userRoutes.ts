import { Router } from 'express';
import { createUserProfile, getUserByWalletAddress } from '../controllers/userController';

const router = Router();

// POST /api/users - create user profile
router.post('/', createUserProfile);

// GET /api/users/wallet/:wallet_address - get user by wallet address
router.get('/wallet/:wallet_address', getUserByWalletAddress);

export default router;


