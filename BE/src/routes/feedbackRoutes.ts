import express from 'express';
import {
  createFeedback,
  markCancelled,
  getFeedbacks,
} from '../controllers/feedbackController';
import { protect, isAdmin } from '../middleware/auth';
import { paginationMiddleware } from '../middleware/filters';

const router = express.Router();

// User routes
router.post('/create-feedback', protect, createFeedback);

// Admin routes
router.put('/mark-cancelled/:id', protect, isAdmin, markCancelled);
router.get('/get-feedback', protect, isAdmin, paginationMiddleware, getFeedbacks);

export default router;

