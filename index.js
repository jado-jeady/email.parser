import express from "express";
import cors from "cors";
// Update this import line to use the official SDK
import * as ngrok from '@ngrok/ngrok'; 
import dotenv from "dotenv";
import { authorize } from "./auth.js";
import sequelize from "./config/database.js";
import Bulks from "./Routes/Bulks.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dotenv.config();

// Ensure NGROK_AUTHTOKEN is set in your .env file
const PORT = parseInt(process.env.APP_PORT, 10) || 5000;


app.get("/", (req, res) => {
  res.send(`    <!DOCTYPE html>
    <html>
      <head>
        <title>Email Parser API Status</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
            margin: 0;
            background-color: #f0f2f5;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #2ecc71;
            margin-bottom: 1rem;
          }
          .status {
            color: #666;
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ API Status</h1>
          <p class="status">Bulk.me API is running Publicly</p>
        </div>
      </body>
    </html>
  `);
});
app.use("/api", Bulks);

sequelize.sync({ alter: true }).then(() => {
  
  // Start the local server first
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Then connect ngrok programmatically
    (async () => {
      try {
        const listener = await ngrok.forward({ 
          addr: PORT,
          authtoken: process.env.NGROK_AUTHTOKEN // Use the token directly from .env
        });
        console.log(`Ngrok tunnel established at: ${listener.url()}`); 
      } catch (err) {
        console.error("Ngrok failed to start:", err);
        process.exit(1);
      }
    })();

  });

}).catch((err) => {
  console.error("Unable to connect to the database:", err);
});
