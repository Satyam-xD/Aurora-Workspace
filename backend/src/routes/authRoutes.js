import express from 'express';
import { authUser, registerUser, getUserProfile, getAllUsers } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { strictRateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply strict rate limiting to sensitive endpoints
router.post('/register', strictRateLimit, registerUser);
router.post('/login', strictRateLimit, authUser);
router.route('/profile').get(protect, getUserProfile);
router.route('/users').get(protect, getAllUsers);

export default router;
