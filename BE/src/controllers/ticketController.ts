import { Response } from 'express';
import ticketService from '../services/ticketService';
import { sendSuccess, sendError } from '../utils/responseHandler';
import { FilteredRequest } from '../middleware/filters';
import { AuthRequest } from '../middleware/auth';

interface AuthFilteredRequest extends FilteredRequest {
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}

// GET /api/tickets/my-tickets - Lấy tickets của user hiện tại
export const getMyTickets = async (req: AuthFilteredRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    
    // Parse filters từ query
    const filters: any = {};
    const typeParam = req.query.type ? String(req.query.type).trim().toLowerCase() : undefined;
    const allowedStatuses = ['active', 'used', 'cancelled'];

    if (typeParam && typeParam !== 'all') {
      if (allowedStatuses.includes(typeParam)) {
        filters.status = typeParam;
      }
    }

    // Filter by ticket_code (mã vé) nếu có
    if (req.query.text) {
      filters.text = String(req.query.text).trim();
    }

    const result = await ticketService.getUserTickets(req.user.id, page, limit, filters);
    
    sendSuccess(res, 'Lấy danh sách tickets thành công', result.tickets, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tickets - Lấy tất cả tickets (Admin)
export const getAllTickets = async (req: AuthFilteredRequest, res: Response) => {
  try {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters: any = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Filter by ticket_code (mã vé)
    if (req.query.text) {
      filters.text = String(req.query.text).trim();
    }

    const result = await ticketService.getAllTickets(page, limit, filters);
    
    sendSuccess(res, 'Lấy danh sách tickets thành công', result.tickets, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tickets/:id - Lấy chi tiết ticket
export const getTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user?.role === 'admin' ? undefined : req.user?.id;

    const ticket = await ticketService.getTicketById(id, userId);
    
    sendSuccess(res, 'Lấy chi tiết ticket thành công', ticket);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/tickets/:id/status - Cập nhật trạng thái ticket (Admin)
export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['active', 'used', 'cancelled'].includes(status)) {
      return sendError(res, 'Trạng thái không hợp lệ', 400);
    }

    const ticket = await ticketService.updateTicketStatus(id, status);
    
    sendSuccess(res, 'Cập nhật trạng thái ticket thành công', ticket);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// PUT /api/tickets/:id/cancel - Hủy ticket
export const cancelTicket = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const id = parseInt(req.params.id);
    const userId = req.user.role === 'admin' ? undefined : req.user.id;

    const ticket = await ticketService.cancelTicket(id, userId);
    
    sendSuccess(res, 'Hủy ticket thành công', ticket);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tickets/tour/:tourId - Lấy tất cả tickets theo tour_id với filter status
export const getTicketsByTourId = async (req: AuthFilteredRequest, res: Response) => {
  try {
    const tourId = parseInt(req.params.tourId);
    
    if (isNaN(tourId) || tourId <= 0) {
      return sendError(res, 'Tour ID không hợp lệ', 400);
    }

    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters: any = {};

    // Filter by status
    if (req.query.status) {
      const statusParam = String(req.query.status).trim().toLowerCase();
      const allowedStatuses = ['active', 'used', 'cancelled'];
      
      if (statusParam !== 'all' && allowedStatuses.includes(statusParam)) {
        filters.status = statusParam;
      }
    }

    // Filter by ticket_code (mã vé)
    if (req.query.text) {
      filters.text = String(req.query.text).trim();
    }

    const result = await ticketService.getTicketsByTourId(tourId, page, limit, filters);
    
    sendSuccess(res, 'Lấy danh sách tickets theo tour thành công', result.tickets, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

// GET /api/tickets/order/:orderId - Lấy tickets theo order_id
export const getTicketsByOrderId = async (req: AuthFilteredRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId) || orderId <= 0) {
      return sendError(res, 'Order ID không hợp lệ', 400);
    }

    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 10;
    const filters: any = {};

    if (req.query.status) {
      const statusParam = String(req.query.status).trim().toLowerCase();
      const allowedStatuses = ['active', 'used', 'cancelled'];

      if (statusParam !== 'all' && allowedStatuses.includes(statusParam)) {
        filters.status = statusParam;
      }
    }

    if (req.query.text) {
      filters.text = String(req.query.text).trim();
    }

    const result = await ticketService.getTicketsByOrderId(orderId, page, limit, filters);

    sendSuccess(res, 'Lấy danh sách tickets theo order thành công', result.tickets, result.pagination);
  } catch (error: any) {
    sendError(res, error.message);
  }
};

