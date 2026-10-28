require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const { notFound, errorHandler } = require("./src/middleware/error");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.json({ message: "Akatsuki's Draft API is running" }));

// Middleware to ensure MongoDB connection before processing API routes (crucial for Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use("/auth", require("./src/routes/authRoutes"));
app.use("/posts", require("./src/routes/postRoutes"));
app.use("/admin", require("./src/routes/adminRoutes"));
app.use("/ai", require("./src/routes/aiRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module && !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB on startup:", err.message);
      process.exit(1);
    });
}

module.exports = app;
