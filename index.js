import express from "express";
import cors from "cors";
import { authorize } from "./auth.js";
import sequelize from "./config/database.js";
import emailRoutes from "./Routes/mailReaderRoutes.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/", emailRoutes);

sequelize.sync({ alter: true }).then(() => {
  app.listen(5000, async () => {
    console.log("Server running on http://localhost:5000");
    await authorize(); // Optional: preload token
  });
});