import "dotenv/config";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import http from "http";
import { Server as SocketServer, Socket } from "socket.io";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import restaurantRoutes from "./routes/restaurant";
import orderRoutes from "./routes/order";
import kitchenRoutes from "./routes/kitchen";
import subscriptionRoutes from "./routes/subscription";
import cors from "cors";

const app = express();

app.use(express.json({ limit: "10kb" }));

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Unknown route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server
let server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection handler
io.on("connection", (socket: Socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join restaurant room for targeted emissions
  socket.on("join_restaurant", (restaurantId: string) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`📍 Socket ${socket.id} joined restaurant ${restaurantId}`);
  });

  // Leave restaurant room
  socket.on("leave_restaurant", (restaurantId: string) => {
    socket.leave(`restaurant_${restaurantId}`);
    console.log(`📍 Socket ${socket.id} left restaurant ${restaurantId}`);
  });

  // Handle order status updates from kitchen
  socket.on("update_order_status", ({ orderId, status }: { orderId: string; status: string }) => {
    io.to(`restaurant_${socket.handshake.query.restaurantId}`).emit("order_status_updated", { orderId, status });
    console.log(`📊 Order ${orderId} status updated to ${status}`);
  });

  // Handle order status updates from frontend (POS)
  socket.on("kitchen_order_status", ({ orderId, status, kitchenId }: { orderId: string; status: string; kitchenId?: string }) => {
    // Broadcast to all sockets in the restaurant room except the sender
    socket.to(`restaurant_${socket.handshake.query.restaurantId}`).emit("kitchen_status_update", { orderId, status, kitchenId });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Export io for use in routes
(app as any).io = io;

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("✅ MongoDB connected");
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  server?.close(() => {
    console.log("💚 Process terminated");
    mongoose.connection.close();
    io.close();
  });
});