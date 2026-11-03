import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log('MongoDB সংযুক্ত হয়েছে');
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
