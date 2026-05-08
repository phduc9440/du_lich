import express from 'express';
import * as couponController from '../controllers/couponController';
import { protect, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public route - Tìm kiếm mã giảm giá theo code
router.get('/search/:code', couponController.searchCouponByCode);

// Admin routes - Quản lý mã giảm giá
router.get('/', protect, couponController.getAllCoupons);
router.post('/', protect, isAdmin, couponController.createCoupon);

// Hard delete route - Phải đặt trước route /:id để tránh conflict
router.delete('/:id/delete-permanent', protect, isAdmin, couponController.hardDeleteCoupon);

router.get('/:id', protect, isAdmin, couponController.getCouponById);
router.put('/:id', protect, isAdmin, couponController.updateCoupon);
router.delete('/:id', protect, isAdmin, couponController.deleteCoupon);

export default router;

