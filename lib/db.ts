import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<{ isConnected: boolean; isMock: boolean }> {
  if (!MONGODB_URI) {
    // Return flag indicating MongoDB URI is missing (app will fallback gracefully to in-memory store)
    return { isConnected: false, isMock: true };
  }

  if (cached.conn) {
    return { isConnected: true, isMock: false };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    return { isConnected: true, isMock: false };
  } catch (e) {
    cached.promise = null;
    console.warn("MongoDB Connection Error, falling back to mock mode:", e);
    return { isConnected: false, isMock: true };
  }
}
