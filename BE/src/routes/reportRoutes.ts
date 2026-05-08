import express from 'express';
import {
  getRevenueStats,
  getTopRatedTours,
  getTopTours,
  getTopUsers,
} from '../controllers/reportController';
import { isAdmin, protect } from '../middleware/auth';

const router = express.Router();

router.use(protect, isAdmin);

///api/admin/reports/revenue?range=day&from=2025-11-10&to=2025-11-17
///api/admin/reports/revenue?range=month&from=2025-11-10&to=2025-11-17
///api/admin/reports/revenue?range=quarter&from=2025-11-10&to=2025-11-17
///api/admin/reports/revenue?range=year&from=2025-11-10&to=2025-11-17
// {
//   "range": {
//       "startDate": "2025-11-09T17:00:00.000Z",
//       "endDate": "2026-11-17T16:59:59.999Z"
//   },
//   "summary": {
//       "totalRevenue": 169300000,
//       "orderCount": 18,
//       "totalTickets": 53,
//       "averageOrderValue": 9405555.555555556
//   },
//   "breakdown": [
//       {
//           "period": "2025-11-21",
//           "totalRevenue": 169300000,
//           "totalTickets": 53,
//           "orderCount": 18
//       }
//   ]
// }
router.get('/revenue', getRevenueStats);
///api/admin/reports/top-tours?limit=20&range=day&from=2025-11-10&to=2025-11-17
///api/admin/reports/top-tours?limit=20&range=month&from=2025-11-10&to=2025-11-17
///api/admin/reports/top-tours?limit=20&range=quarter&from=2025-11-10&to=2025-11-17
///api/admin/reports/top-tours?limit=20&range=year&from=2025-11-10&to=2025-11-17
// {
//   "rank": 1,
//   "tour": {
//       "id": 14,
//       "title": "Tour Phan Thiết - Mũi Né 3N2Đ - Sa mạc bên bờ biển",
//       "destination": "Phan Thiết - Mũi Né",
//       "main_image": "https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=800"
//   },
//   "totalRevenue": 46800000,
//   "totalTickets": 18,
//   "orderCount": 4
// },
router.get('/top-tours', getTopTours);
///api/admin/reports/top-rated-tours?limit=10&range=day&from=2025-11-10&to=2025-11-17&minReviews=3
///api/admin/reports/top-rated-tours?limit=10&range=month&from=2025-11-10&to=2025-11-17&minReviews=3
///api/admin/reports/top-rated-tours?limit=10&range=quarter&from=2025-11-10&to=2025-11-17&minReviews=3
///api/admin/reports/top-rated-tours?limit=10&range=year&from=2025-11-10&to=2025-11-17&minReviews=3
// {
//   "rank": 1,
//   "tour": {
//       "id": 8,
//       "title": "Tour Ninh Bình 2N1Đ - Vịnh Hạ Long trên cạn",
//       "destination": "Ninh Bình",
//       "main_image": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800"
//   },
//   "averageRating": 4,
//   "reviewCount": 12
// },
router.get('/top-rated-tours', getTopRatedTours);
///api/admin/reports/top-users?limit=20&range=day&from=2025-11-10&to=2025-11-17
///api/admin/reports/top-users?limit=20&range=month&from=2025-11-10&to=2025-11-17
///api/admin/reports/top-users?limit=20&range=quarter&from=2025-11-10&to=2025-11-17
///api/admin/reports/top-users?limit=20&range=year&from=2025-11-10&to=2025-11-17
// {
//   "rank": 1,
//   "user": {
//       "id": 12,
//       "username": "testuser22",
//       "email": "phth1358@gmail.com",
//       "phone": "0123456789",
//       "avatar_url": null
//   },
//   "totalSpent": 41600000,
//   "orderCount": 3,
//   "lastOrderAt": "2025-11-21T13:31:04.000Z",
//   "averageOrderValue": 13866666.666666666
// },
router.get('/top-users', getTopUsers);

export default router;

