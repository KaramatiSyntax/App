import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached.promise = (async function connectWithRetry() {
      try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, opts);
        
        // Set up event handlers after connection is established
        conn.connection.on("connected", () => {
          console.log("MongoDB connected");
        });

        conn.connection.on("error", (err) => {
          console.error("MongoDB connection error:", err);
        });

        conn.connection.on("disconnected", () => {
          console.log("MongoDB disconnected");
        });

        return conn;
      } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

export default dbConnect;