import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import Domain from '../models/email.domains.js';
import dotenv from 'dotenv';
import Paypack from 'paypack-js';

import BulkEmail from '../models/BulkemailModel.js';


dotenv.config();

// ✅ Initialize SES client
const ses = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});



// Initialize PayPACK
const PaypackJs = Paypack.default || Paypack;
const paypack = PaypackJs.config({
  client_id: 'af4fffd8-a932-11f0-b7f6-deadd43720af',
  client_secret: 'a06ea88e87b8a21af669b232d67da163da39a3ee5e6b4b0d3255bfef95601890afd80709',
});

const info = await paypack.me();
// log Paypack user info to the console
//console.log(info.data);


// SES Initialization


// MOMO PAYMENT 
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

// MOMO PAYMENT ENDS HERE



// Verify Domain for SES
export const verifyDomain = async (req, res) => {
  try {
    const { userId, domainName } = req.body;

    const data = await ses.verifyDomainIdentity({ Domain: domainName }).promise();
    const txtRecord = data.VerificationToken;

    const dkimData = await ses.verifyDomainDkim({ Domain: domainName }).promise();
    const dkimRecords = dkimData.DkimTokens.map(token => ({
      name: `${token}._domainkey.${domainName}`,
      type: "CNAME",
      value: `${token}.dkim.amazonses.com`,
    }));

    const domain = await insertDomain(userId, domainName, txtRecord, dkimRecords);
    res.json({ message: "Domain verification started", domain });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify domain" });
  }
};

// Record domain in db
export const insertDomain = async (userId, domainName, txtRecord, dkimRecords) => {
  const domain = await Domain.create({
    userId,
    domainName,
    txtRecord,
    dkimRecord: dkimRecords,
    verified: false,
  });
  return domain;
};

// Get verified domain for user from a database
export const getUserDomain = async (userId) => {
  const domain = await Domain.findOne({
    where: { userId, verified: true },
  });
  return domain;
};

// SES SNS COntroller to handle bounces and complaints

export const handleSesEvent = async (req, res) => {
  try {
    const messageType = req.headers["x-amz-sns-message-type"];
    const message = req.body;

    // Handle SNS subscription confirmation
    if (messageType === "SubscriptionConfirmation" && message.SubscribeURL) {
      console.log("Confirming SNS subscription...");
      await fetch(message.SubscribeURL);
      return res.send("Subscription confirmed");
    }

    if (messageType === "Notification") {
      const notification = JSON.parse(message.Message);
      const eventType = notification.eventType;

      console.log("SES Event:", eventType);

      if (eventType === "Delivery") {
        await Email.update(
          { delivered: true },
          { where: { messageId: notification.mail.messageId } }
        );
      }

      if (eventType === "Open") {
        await Email.update(
          { opened: true },
          { where: { messageId: notification.mail.messageId } }
        );
      }

      if (eventType === "Click") {
        await Email.update(
          { clicked: true },
          { where: { messageId: notification.mail.messageId } }
        );
      }

      if (eventType === "Bounce" || eventType === "Complaint") {
        await Email.update(
          { bounced: true },
          { where: { messageId: notification.mail.messageId } }
        );
      }
    }

    res.status(200).end();
  } catch (error) {
    console.error("SES Webhook Error:", error);
    res.status(500).end();
  }
};



/**
 * @desc Send branded email via AWS SES
 * @route POST /api/emails/send
 * @access Public or Authenticated (your choice)
 */
export const sendBrandedEmail = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: to, subject, and html",
      });
    }

    const params = {
      Source: "noreply@masteryhub.co.rw", // ✅ verified sender in SES
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          ...(text ? { Text: { Data: text, Charset: "UTF-8" } } : {}),
        },
      },
      // 👇 Include only if you've set up tracking
      ConfigurationSetName: "my-first-configuration-set",
    };

    const command = new SendEmailCommand(params);
    const response = await ses.send(command);

    console.log("✅ Email sent successfully:", response.MessageId);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: response.MessageId,
      to,
    });
  } catch (error) {
    console.error("❌ SES Email Send Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};