import { MongoClient } from "mongodb";

let client;
let db;

export const connectDB = async () => {
  if (db) return db;
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing.");
  }
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(
    process.env.DB_NAME || "kki_smart_connects"
  );
  await db.command({ ping: 1 });
  console.log(`MongoDB connected: ${db.databaseName}`);
  return db;
};

export const getDB = () => {
  if (!db) {
    throw new Error("MongoDB has not connected yet.");
  }
  return db;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
};
