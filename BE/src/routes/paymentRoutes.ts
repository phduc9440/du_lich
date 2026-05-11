import express from 'express';
import {
  handleVNPayReturn,
  handleVNPayIPN,
} from '../controllers/paymentController';

const router = express.Router();

// VNPay redirect user về sau khi thanh toán
router.get('/vnpay-return', handleVNPayReturn);

// VNPay gọi server-to-server để xác nhận giao dịch (IPN)
router.get('/vnpay-ipn', handleVNPayIPN);

export default router;
