import express from 'express';
import authRoutes from './authRoutes';
import adminAuthRoutes from './adminAuthRoutes';
import tourRoutes from './tourRoutes';
import bookingRoutes from './bookingRoutes';
import reviewRoutes from './reviewRoutes';
import userRoutes from './userRoutes';
import notificationRoutes from './notificationRoutes';
import ticketRoutes from './ticketRoutes';
import couponRoutes from './couponRoutes';
import categoryRoutes from './categoryRoutes';
import paymentRoutes from './paymentRoutes';
import reportRoutes from './reportRoutes';
import feedbackRoutes from './feedbackRoutes';
import adminRoutes from './adminRoutes';
const router = express.Router();

// User authentication routes
router.use('/auth', authRoutes);

// Admin authentication routes
router.use('/admin/auth', adminAuthRoutes);

// Other routes
router.use('/tours', tourRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/tickets', ticketRoutes);
router.use('/coupons', couponRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin/reports', reportRoutes);

// Payment routes
router.use('/v1/payment', paymentRoutes);

router.use('/feedbacks', feedbackRoutes);
router.use('/admins', adminRoutes);
export default router;

