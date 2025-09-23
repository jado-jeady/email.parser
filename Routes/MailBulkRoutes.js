import express from 'express';
import { sendBulkEmails } from '../Controllers/EmailBulkController.js';

const router = express.Router();

router.post('/send-email-bulk', sendBulkEmails);

export default router;
