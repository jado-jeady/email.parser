import crypto from "crypto";
import { Op } from "sequelize";
import AnonymousUser from "../models/Mail.anonymus.User.js";
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import Domain from '../models/Email.domains.js';
import dotenv from 'dotenv';
import Paypack from 'paypack-js';
import Email from '../models/Email.js';
import sequelize from "../config/database.js";
import { Console, error } from "console";


dotenv.config();

// ✅ Initialize SES client
const ses = new SESClient({
  region: process.env.AWS_REGION || "eu-north-1",
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

//const info = await //paypack.me();
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

// SES SNS COntroller to handle bounces and complaints with Callback

export const handleSesEvent = async (req, res) => {
  try {
    const messageType = req.headers["x-amz-sns-message-type"];
    const message = req.body;
    let events=[];

    // 🔹 Handle subscription confirmation
    if (messageType === "SubscriptionConfirmation" && message.SubscribeURL) {
      console.log("Confirming SNS subscription...");
      await fetch(message.SubscribeURL);
      console.log("SNS subscription confirmed");
      return; // ✅ stop here
    }

    // 🔹 Handle notifications
    if (messageType === "Notification") {
      const notification = JSON.parse(message.Message);
      const eventType = notification.eventType;
      const messageId = notification.mail.messageId;
      

      console.log("SES Event:", eventType);

      // Track each event type
      if (eventType === "Delivery") {
        await Email.update(
        { status: eventType.toLowerCase(), updatedAt: new Date() },
         { where: { messageId } }
        );
        

      }
      

      if (eventType === "Open") {
         await Email.update(
        { status: eventType.toLowerCase(), updatedAt: new Date() },
         { where: { messageId } }
        );
      }

      if (eventType === "Click") {
         await Email.update(
        { status: eventType.toLowerCase(), updatedAt: new Date() },
         { where: { messageId } }
        );
      }

      if (eventType === "Bounce") {
        await Email.update(
        { status: eventType.toLowerCase(), updatedAt: new Date() },
         { where: { messageId } }
        );
      }

      if (eventType === "Complaint") {
         await Email.update(
        { status: eventType.toLowerCase(), updatedAt: new Date() },
         { where: { messageId } }
        );
      }
    }

    // ✅ Always send *one* success response
    return res.status(200).json({ success: true, events: events });

  } catch (error) {
    console.error("SES Webhook Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};




/**
 * @desc Send branded email via AWS SES
 * @route POST /api/emails/send
 * @access Public or Authenticated (your choice)
 */
export const sendBrandedEmail = async (req, res) => {
  try {
    const { fingerprint, recipients, subject, body } = req.body;

    if (!recipients || !subject || !body) {
      if(!fingerprint){
        return res.status(400).json({
          success: false,
          errorType: "Fingerprint is required",
          message: "Internal Error",
        });
      }
      return res.status(400).json({
        success: false,
        errorType: "MissingFields",
        message: "Missing required fields: recipients, subject, and body",
      });
    }

    // ✅ Generate hybrid hash for better tracking
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const hash = crypto
      .createHash("sha256")
      .update(ipAddress + userAgent)
      .digest("hex");

      // ✅ Find existing record
    let user = await AnonymousUser.findOne({
      where: {
        [Op.or]: [{ fingerprint }, { hash }],
      },
    });

    if (!user) {
      // Create new anonymous record
      user = await AnonymousUser.create({
        fingerprint,
        ip_address: ipAddress,
        hash,
      });
    }
     // ✅ Check email send limit (3 free)
    if (user.emails_sent_count >= 3) {
       console.log("Free Email Limit Reached for User:", hash);
      return res
        .status(200)
        .json({ errorType: "FreeLimitExceeded", fingerprint: hash, message: "Your Free Email Limit Has Been Reached. Please Login or Create an Account to Continue." });
       
    }

    // ✅ Increment email sent count
    user.emails_sent_count += 1;
    await user.save();
    

    const results = await sendBulkEmails(recipients, subject, body);
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      results,
    });
    return {
      success: true,
      message: "Email sent successfully",
      results: results,
    };

     
  } catch (error) {
    console.error("❌ SES Email Send Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


//function to send an email to any array of recipients

export const sendBulkEmails = async (recipients, subject, body) => {
  const results = [];

  for (const email of recipients) {
    const params = {
      Source: "no-reply@masteryhub.co.rw",
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: subject },
        Body: { Html: { Data: body } },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const response = await ses.send(command);

      // Store each email in DB with messageId for tracking
      await Email.create({
        email,
        subject,
        status: "sent",
        messageId: response.MessageId,
      });

      results.push({ email, status: "sent" });

    } catch (error) {
      await Email.create({
        email,
        subject,
        status: "failed",
        error: error.message,
      });

      results.push({ email, status: "failed", error: error.message });
    }
  }

  return results;
};

// 