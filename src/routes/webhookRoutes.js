import express from 'express';
import webhookController from '../controllers/webhookController.js';

const router = express.Router();

router.post('/flow', webhookController.handleFlow);
router.post('/webhook', webhookController.handleIncoming);
router.get('/webhook', webhookController.verifyWebhook);

export default router;