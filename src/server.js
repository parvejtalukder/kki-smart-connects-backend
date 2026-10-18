import "dotenv/config";
import app from "./app.js";
import { connectDB, closeDB } from "./config/mongodb.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});