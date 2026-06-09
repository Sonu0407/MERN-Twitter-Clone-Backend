import express from "express";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectDB from "./database/db.js";

import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

// middleware for accepting json data (req.body)
app.use(express.json({ limit: "5mb" }));

// middleware to parse the cookies
app.use(cookieParser());

// middleware to clear cors error
app.use(
  cors({
    origin: "https://twitter-clone-sonu.vercel.app",
    credentials: true,
    // exposedHeaders: ["set-cookie"],
  }),
);

// middleware for Routes
app.use("/api/auth", authRoutes);
// middleware for User Routes
app.use("/api/users", userRoutes);
// middleware for post routes
app.use("/api/posts", postRoutes);
// middleware for notification routes
app.use("/api/notifications", notificationRoutes);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`An error occurred: `, error.message);
  });
