import express from 'express';
import {
  getTours,
  getAdminTours,
  getAdminToursV2,
  getFeaturedTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  hardDeleteTour,
  getDestinationGallery,
  getMostBookedTours,
} from '../controllers/tourController';
import {
  assignGuideToTour,
  getAvailableGuidesForTour,
  getAssignedToursUpcoming,
  getGuidesByTourAndDates,
  getMyTours,
  getOrdersByTour,
} from '../controllers/tourGuideAssignmentController';
import { protect, isAdmin } from '../middleware/auth';
import { tourFilterMiddleware, adminTourFilterMiddleware } from '../middleware/filters';
import { paginationMiddleware } from '../middleware/filters/pagination';

const router = express.Router();

// Public routes với filter middleware
router.get('/', tourFilterMiddleware, getTours);
router.get('/featured', getFeaturedTours); //điểm đến phổ biến
router.get('/most-booked', getMostBookedTours); // Lấy tour được đặt nhiều nhất (dựa trên orders completed)
router.get('/gallery/destinations', getDestinationGallery);
router.get('/admin', protect, isAdmin, adminTourFilterMiddleware, getAdminTours);
router.get('/admin/v2', protect, isAdmin, adminTourFilterMiddleware, getAdminToursV2);

// Guide assignment routes - phải đặt trước /:id để tránh conflict
router.get('/assigned/upcoming', protect, isAdmin, getAssignedToursUpcoming); //lấy tours có is_active: false
router.get('/guides/by-dates/:tour_id/:start_date/:end_date', protect, isAdmin, getGuidesByTourAndDates); // Lấy guides theo tour_id, start_date, end_date
router.post('/orders-for-guide/by-tour/:tour_id/:start_date/:end_date', protect, getOrdersByTour); // Lấy đơn hàng được phân công cho guide theo tour_id, start_date, end_date
router.get('/my-tours', protect, paginationMiddleware, getMyTours); // Lấy tất cả tours của guide đang đăng nhập với pagination và status filter
router.get('/orders/by-tour/:tour_id/:start_date/:end_date', protect, isAdmin, getOrdersByTour); // Lấy đơn hàng được phân công cho guide theo tour_id, start_date, end_date
router.post('/:tourId/assign-guide', protect, isAdmin, assignGuideToTour);
router.get('/:tourId/available-guides', protect, isAdmin, getAvailableGuidesForTour);


// Route :id phải đặt sau các routes cụ thể để tránh conflict
router.get('/:id', getTourById);

// Admin routes - Yêu cầu đăng nhập và phải là admin
router.post('/', protect, isAdmin, createTour);
router.put('/:id', protect, isAdmin, updateTour);
router.delete('/:id', protect, isAdmin, deleteTour); // Soft delete
router.delete('/:id/permanent', protect, isAdmin, hardDeleteTour); // Hard delete

export default router;

