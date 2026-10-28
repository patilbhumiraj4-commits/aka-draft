const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not defined");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log("MongoDB connected");
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error("MongoDB connection failed:", err.message);
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;
