// controllers/sms.controller.js
import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendBulkSms = async (req, res) => {
  const { message, recipients, senderId } = req.body;

  if (!message || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Message and recipients are required.' });
  }

  if (!senderId || senderId.length > 15 || /[^a-zA-Z0-9]/.test(senderId)) {
    return res.status(400).json({ error: 'Sender ID must be alphanumeric and ≤ 15 characters.' });
  }

  try {
    const results = await Promise.all(
      recipients.map(async (to) => {
        try {
          const msg = await client.messages.create({
            body: message,
            to,
            from: senderId, // ✅ dynamic sender name
          });
          return { to, status: 'sent', sid: msg.sid };
        } catch (err) {
          return { to, status: 'failed', error: err.message };
        }
      })
    );

    res.json({ message: 'Bulk SMS processed', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};