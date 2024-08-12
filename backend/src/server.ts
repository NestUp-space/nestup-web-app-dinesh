import dotenv from "dotenv";
import Logger from "@logger";
import { port } from "@config";
import app from "./app";

// Load environment variables from .env file
dotenv.config();

// Check if port is defined
if (!port) {
  Logger.error("Port is not defined. Please check your .env file.");
  process.exit(1);
}

// Start the server
app
  .listen(port, () => {
    Logger.info(`Server running on port: ${port}`);
  })
  .on("error", (e) => {
    Logger.error("Server error:", e);
    process.exit(1);
  });

// Log environment variables for debugging
Logger.info("Environment Variables:");
Logger.info(`Redis Host: ${process.env.REDIS_HOST}`);
Logger.info(`Redis Port: ${process.env.REDIS_PORT}`);
Logger.info(`Redis Password: ${process.env.REDIS_PASSWORD ? "****" : "Not set"}`);
Logger.info(`Database URL: ${process.env.DATABASE_URL}`);
