import express from "express";
import { authorize } from "../auth.js";
import { fetchEmails } from "../Controllers/mailReaderController.js";

const router = express.Router();

router.get("/readmails", async (req, res) => {
  try {
    const auth = await authorize();
    const results = await fetchEmails(auth);

    res.json({
      message: "Email sync completed",
      summary: {
        processed: results.processed,
        successful: results.successful,
        skipped: results.skipped,
        errors: results.errors,
      },
      ...(results.errors > 0 && { errorDetails: results.errorDetails }),
      data: results || [],
    });
  } catch (error) {
    res.status(500).json({
      error: "Email sync failed",
      details: error.message,
    });
  }
});

export default router;