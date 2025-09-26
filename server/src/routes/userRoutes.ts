import { Router } from 'express';
import { createUserProfile } from '../controllers/userController';

const router = Router();

// POST /api/users - create user profile
router.post('/', createUserProfile);

export default router;


