import express from 'express';
import multer from 'multer';
import { sendBulkEmails } from '../Controllers/EmailBulkController.js';

const router = express.Router();

const upload = multer(); // For parsing multipart/form-data without files

// Use the upload middleware to handle form-data

router.post('/send', upload.none(), sendBulkEmails);

export default router;
