import nodemailer from 'nodemailer';

import dotenv from 'dotenv';
dotenv.config();

import BulkEmail from '../models/BulkemailModel.js';


import Paypack from 'paypack-js';
const PaypackJs = Paypack.default || Paypack;

const paypack = PaypackJs.config({
  client_id: 'af4fffd8-a932-11f0-b7f6-deadd43720af',
  client_secret: 'a06ea88e87b8a21af669b232d67da163da39a3ee5e6b4b0d3255bfef95601890afd80709',
});

const info = await paypack.me();
console.log(info.data);




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




export const paypackPayment = async (req, res) => {
  try {
    const response = await paypack.cashin({
      number: "0782228575", // MTN or Airtel number
      amount: 100,
      environment: "development" // ✅ change to "production" when going live
    });

    console.log(response.data);
    res.status(200).json({
      message: "Payment initiated successfully",
      data: response.data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.response?.data || error.message
    });
  }
};
