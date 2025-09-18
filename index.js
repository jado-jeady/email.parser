import express from "express";
import sequelize from "./config/database.js";
import Application from "./models/Application.js";
import { authorize } from "./auth.js";   // use new file
import { parseEmailContent } from "./services/parser.js";
import { google } from "googleapis";
import cors from "cors";



const app = express();
app.use(cors({
  origin: '*', // Allow all origins for simplicity; adjust as needed for security
}));
app.use(express.json());

async function extractEmailBody(fullMsg) {
  try {
    // Handle different email structures
    const payload = fullMsg.data.payload;
    
    // Check for multipart message
    if (payload.parts && payload.parts.length > 0) {
      // Look for text/plain part first, fallback to text/html
      const textPart = payload.parts.find(part => 
        part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      
      if (textPart && textPart.body && textPart.body.data) {
        return Buffer.from(textPart.body.data, "base64").toString("utf8");
      }
    }
    
    // Handle simple message structure
    if (payload.body && payload.body.data) {
      return Buffer.from(payload.body.data, "base64").toString("utf8");
    }
    
    throw new Error('No readable email body found');
  } catch (error) {
    throw new Error(`Failed to extract email body: ${error.message}`);
  }
}

async function processEmailMessage(gmail, msg) {
  try {
    // Check if already stored (early return to avoid API call)
    const exists = await Application.findOne({ where: { gmailId: msg.id } });
    if (exists) {
      console.log(`Skipping duplicate: ${msg.id}`);
      return { status: 'skipped', reason: 'duplicate' };
    }

    // Fetch full message
    const fullMsg = await gmail.users.messages.get({ 
      userId: "me", 
      id: msg.id,
      format: 'full'
    });

    // Extract body text with error handling
    const body = await extractEmailBody(fullMsg);
        
    if (!body || body.trim().length === 0) {
      throw new Error('Email body is empty');
    }

    // Parse custom fields with validation
    const parsed = parseEmailContent(body);
    
    if (!parsed || !parsed.fullName) {
      throw new Error('Failed to parse required fields from email');
    }
    
   console.log(JSON.stringify(parsed, null, 2));

    // Save with Gmail ID using transaction for data consistency
    const transaction = await sequelize.transaction();
    try {
      await Application.create({
        gmailId: msg.id,
        ...parsed
      }, { transaction });
      
      await transaction.commit();
      console.log(`Saved new application from: ${parsed.fullName}`);
      return { status: 'successfully', fullData: parsed };
    } catch (dbError) {
      await transaction.rollback();
      throw dbError;
    }

  } catch (error) {
    console.error(`Failed to process email ${msg.id}:`, error.message);
    return { status: 'error', error: error.message, messageId: msg.id };
  }
}

async function fetchEmails(auth) {
  try {
    const gmail = google.gmail({ version: "v1", auth });

    let allMessages = [];
    let nextPageToken = null;

    // Loop through pages until no more tokens or desired limit reached
    do {
      const res = await gmail.users.messages.list({
        userId: "me",
        q: "subject:'🚀 New Application Submission'",
        maxResults: 100, // Gmail allows up to 500 per page
        pageToken: nextPageToken
      });

      const messages = res.data.messages || [];
      allMessages.push(...messages);
      nextPageToken = res.data.nextPageToken;

      // Optional: throttle to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } while (nextPageToken && allMessages.length < 1000); // You can adjust this limit

    if (allMessages.length === 0) {
      console.log('No new application emails found');
      return { processed: 0, successful: 0, errors: 0, skipped: 0 };
    }

    console.log(`Found ${allMessages.length} email(s) to process`);

    const results = {
      processed: 0,
      successful: 0,
      errors: 0,
      skipped: 0,
      errorDetails: []
    };

    for (const msg of allMessages) {
      const result = await processEmailMessage(gmail, msg);
      results.processed++;

      switch (result.status) {
        case 'success':
        case 'successfully':
          results.successful++;
          break;
        case 'skipped':
          results.skipped++;
          break;
        case 'error':
          results.errors++;
            results.errorDetails.push({
            messageId: result.messageId,
            error: result.error,
            // Try to extract the column name from the error message if possible
            column: (() => {
              // Common Postgres error format: 'value too long for type character varying(255) for column "fullName"'
              const match = result.error.match(/column "?([a-zA-Z0-9_]+)"?/i);
              return match ? match[1] : null;
            })()
            });
          break;
      }

      // Optional: throttle every 50 messages
      if (results.processed % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`📊 Processing complete: ${results.successful} successful, ${results.skipped} skipped, ${results.errors} errors`);
    return results;

  } catch (error) {
    console.error('❌ Failed to fetch emails:', error.message);
    throw new Error(`Email sync failed: ${error.message}`);
  }
}




app.get("/sync", async (req, res) => {
  try {
    const auth = await authorize();
    const results = await fetchEmails(auth);
    
    res.json({
      message: "Email sync completed",
      summary: {
      processed: results.processed,
      successful: results.successful,
      skipped: results.skipped,
      errors: results.errors
      },
      ...(results.errors > 0 && { errorDetails: results.errorDetails }),
      data: results || []
    });
  } catch (error) {
    console.error('Sync endpoint error:', error.message);
    res.status(500).json({ 
      error: "Email sync failed", 
      details: error.message 
    });
  }
});

sequelize.sync({alter:true}).then(() => {
  app.listen(5000, async () => {
    console.log("Server running on http://localhost:5000");
    await authorize();
    
  });

});
