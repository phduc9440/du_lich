import express from 'express';
import {
  handleMoMoReturn,
  handleMoMoWebhook,
} from '../controllers/paymentController';

const router = express.Router();

router.get('/momo-return', handleMoMoReturn);
router.post('/momo-webhook', handleMoMoWebhook);

export default router;

