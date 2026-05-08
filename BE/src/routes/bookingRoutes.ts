import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  confirmBooking,
  completeBooking,
  updatePaymentStatus,
  getTotalCompletedOrders,
  hardDeleteOrder,
} from '../controllers/bookingController';
import { protect, isAdmin } from '../middleware/auth';
import { bookingFilterMiddleware, paginationMiddleware } from '../middleware/filters';

const router = express.Router();

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, paginationMiddleware, getMyBookings);

// Stats routes - Phải đặt trước các route có params động (:id)
router.get('/stats/completed', protect, isAdmin, getTotalCompletedOrders);

router.get('/:id', protect, getBookingById);

router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/confirm', protect, confirmBooking);
router.put('/:id/complete', protect, completeBooking);

router.put('/:id/payment', protect, updatePaymentStatus);

// Hard delete route - Phải đặt trước route /:id để tránh conflict
router.delete('/:id/delete-permanent', protect, isAdmin, hardDeleteOrder);

// Admin routes - Yêu cầu đăng nhập và phải là admin
router.get('/', protect, isAdmin, bookingFilterMiddleware, getAllBookings);

export default router;

