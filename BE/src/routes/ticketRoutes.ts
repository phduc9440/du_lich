import { Router } from 'express';
import {
  getMyTickets,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  cancelTicket,
  getTicketsByTourId,
  getTicketsByOrderId,
} from '../controllers/ticketController';
import { protect, isAdmin } from '../middleware/auth';
import { paginationMiddleware } from '../middleware/filters/pagination';

const router = Router();

// User routes - cần authentication
router.get('/my-tickets', protect, paginationMiddleware, getMyTickets);
router.get('/tour/:tourId', protect, paginationMiddleware, getTicketsByTourId);
router.get('/order/:orderId', protect, paginationMiddleware, getTicketsByOrderId);
router.get('/:id', protect, getTicketById);
router.put('/:id/cancel', protect, cancelTicket);

// Admin routes - cần authentication và admin role
router.get('/', protect, isAdmin, paginationMiddleware, getAllTickets);
router.put('/:id/status', protect, isAdmin, updateTicketStatus);

export default router;

