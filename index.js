import express from "express";
import cors from "cors";
import { authorize } from "./auth.js";
import sequelize from "./config/database.js";
import emailRoutes from "./Routes/mailReaderRoutes.js";
import bulkEmailRoutes from "./Routes/Bulkemails.js";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




app.get("/", (req, res) => {
  res.send("Email Parser API is running");
});
app.use("/api/reademail", emailRoutes);
app.use("/api/bulk-email", bulkEmailRoutes);

sequelize.sync({ alter: true }).then(() => {
  app.listen(5000, "0.0.0.0", async () => {
    console.log("Server running on http://localhost:5000");
    await authorize(); // Optional: preload token
  });
});