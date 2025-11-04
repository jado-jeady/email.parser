import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
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


// Initialize SES client
const ses = new SESClient({
  region: 'us-east-1', // or your SES region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Create Nodemailer transport using SES
const transporter = nodemailer.createTransport({
  SES: { ses, aws: { SendEmailCommand } },
});


export async function sendBrandedEmail({ to, subject, html, text }) {
  const mailOptions = {
    from: '"Mastery Hub" <product@masteryhub.co.rw>',
    to,
    subject,
    html,
    text,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent:', result.messageId);
    return result;

    
    // Store in DB


  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}


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
