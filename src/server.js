import "dotenv/config";
import { app, server, io } from "./config/socket.js";
import apiApp from "./app.js";
import { connectDB, closeDB } from "./config/mongodb.js";

const PORT = process.env.PORT || 5000;

app.use(apiApp);

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`API and Socket.IO running on port ${PORT}`);
    });

    const shutdown = () => {
      console.log("Shutting down server...");

      io.close(async () => {
        try {
          await closeDB();
          process.exit(0);
        } catch (error) {
          console.error("Shutdown failed:", error);
          process.exit(1);
        }
      });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
