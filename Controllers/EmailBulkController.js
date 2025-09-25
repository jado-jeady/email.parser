import nodemailer from 'nodemailer';
import BulkEmail from '../models/BulkemailModel.js';


// Configure Nodemailer with Brevo SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
});

export const sendBulkEmails = async (req, res) => {
  try {
    const {
      from_email,
      subject,
      range,
      body,
      signature,
      recipients: rawRecipients,
    } = req.body;

    if (!rawRecipients) {
      return res.status(400).json({ error: 'Recipients field is missing.' });
    }

    let recipients;
    try {
      recipients = JSON.parse(rawRecipients);
    } catch (err) {
      return res.status(400).json({ error: 'Recipients must be a valid JSON array.' });
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients list is empty or invalid.' });
    }

    // Send emails
    const sendResults = await Promise.all(
      recipients.map(async (email) => {
        try {
          await transporter.sendMail({
            from: from_email,
            to: email,
            subject,
            html: signature ? `${body}<br><br>${signature}` : body,
          });
          return { email, status: 'sent' };
        } catch (err) {
          return { email, status: 'failed', error: err.message };
        }
      })
    );

    // Store in DB
    await BulkEmail.create({
      email_id: `bulk-${Date.now()}`,
      subject,
      from_email,
      body,
      signature,
      range,
      recipients: JSON.stringify(recipients),
      results: JSON.stringify(sendResults),
    });

    res.json({ message: 'Bulk emails processed and stored', results: sendResults });
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ error: error.message });
  }
};