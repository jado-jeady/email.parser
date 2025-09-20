import { google } from "googleapis";
import sequelize from "../config/database.js";
import Application from "../models/Application.js";
import { parseEmailContent } from "../services/parser.js";

async function extractEmailBody(fullMsg) {
  const payload = fullMsg.data.payload;

  if (payload.parts?.length > 0) {
    const textPart = payload.parts.find(
      part => part.mimeType === "text/plain" || part.mimeType === "text/html"
    );
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, "base64").toString("utf8");
    }
  }

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf8");
  }

  throw new Error("No readable email body found");
}

async function processEmailMessage(gmail, msg) {
  const exists = await Application.findOne({ where: { gmailId: msg.id } });
  if (exists) return { status: "skipped", reason: "duplicate" };

  const fullMsg = await gmail.users.messages.get({
    userId: "me",
    id: msg.id,
    format: "full",
  });

  const body = await extractEmailBody(fullMsg);
  if (!body?.trim()) throw new Error("Email body is empty");

  const parsed = parseEmailContent(body);
  if (!parsed?.fullName) throw new Error("Missing required fields");

  const transaction = await sequelize.transaction();
  try {
    await Application.create({ gmailId: msg.id, ...parsed }, { transaction });
    await transaction.commit();
    return { status: "successfully", fullData: parsed };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

export async function fetchEmails(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  let allMessages = [];
  let nextPageToken = null;

  do {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: "subject:'🚀 New Application Submission'",
      maxResults: 100,
      pageToken: nextPageToken,
    });

    allMessages.push(...(res.data.messages || []));
    nextPageToken = res.data.nextPageToken;
    await new Promise(resolve => setTimeout(resolve, 100));
  } while (nextPageToken && allMessages.length < 1000);

  const results = {
    processed: 0,
    successful: 0,
    errors: 0,
    skipped: 0,
    errorDetails: [],
  };

  for (const msg of allMessages) {
    try {
      const result = await processEmailMessage(gmail, msg);
      results.processed++;
      if (["success", "successfully"].includes(result.status)) results.successful++;
      else if (result.status === "skipped") results.skipped++;
    } catch (error) {
      results.errors++;
      results.errorDetails.push({
        messageId: msg.id,
        error: error.message,
        column: error.message.match(/column "?([a-zA-Z0-9_]+)"?/i)?.[1] || null,
      });
    }

    if (results.processed % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}