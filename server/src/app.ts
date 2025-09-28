import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import contestRoutes from "./routes/contestRoutes";
import nftRoutes from "./routes/nftRoutes";
import { initializeChessSocket } from "./socket/chessSocket";
import ratingRouter from "./routes/ratingRoutes";

const app = express();
const port = process.env.PORT || 8000;

// Create HTTP server and Socket.IO server
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your Next.js dev server
    methods: ["GET", "POST"],
  },
});

// CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/nft", nftRoutes);
app.use("/api/ratings", ratingRouter);

app.get("/", (_req, res) => {
  res.send("Hello, world! Chess server is running!");
});

// Initialize chess socket handlers
initializeChessSocket(io);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Socket.IO server is ready for chess games`);
});

export { io };
