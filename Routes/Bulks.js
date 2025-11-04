import express from 'express';
import multer from 'multer';
import { paypackPayment, sendBulkEmails } from '../Controllers/BulkMailController.js';
import { sendBulkSms } from '../Controllers/BulkSMSController.js';

const router = express.Router();

const upload = multer(); // For parsing multipart/form-data without files

// Use the upload middleware to handle form-data

router.post('/Mail/send', upload.none(), sendBulkEmails);
router.post('/SMS/send',sendBulkSms);
router.post('/Payment/Pay', paypackPayment)

export default router;