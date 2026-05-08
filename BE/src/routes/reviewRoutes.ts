import express from 'express';
import {
  createReview,
  getTourReviews,
  getReviewStats,
  getMyReviews,
  getAllReviews,
  updateReview,
  deleteReview,
  getTop5StarReviews,
} from '../controllers/reviewController';
import { protect, isAdmin } from '../middleware/auth';
import { reviewFilterMiddleware, paginationMiddleware } from '../middleware/filters';

const router = express.Router();

// Public routes
router.get('/tour/:tourId', reviewFilterMiddleware, getTourReviews);
router.get('/stats/:tourId?', getReviewStats);
router.get('/top-5-star', getTop5StarReviews);

// Private routes
router.post('/', protect, createReview);
router.get('/my-reviews', protect, paginationMiddleware, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

// Admin routes - Yêu cầu đăng nhập và phải là admin
router.get('/', protect, isAdmin, reviewFilterMiddleware, getAllReviews);

export default router;

