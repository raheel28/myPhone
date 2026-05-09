// server/src/config/db.js
import dns from 'node:dns';
import mongoose from 'mongoose';

// Force a public DNS resolver if the OS resolver can't handle SRV lookups
// (some ISPs / corporate networks / VPN adapters refuse them, producing
// "querySrv ECONNREFUSED" against mongodb+srv URIs). Override with
// MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1 in .env if needed.
const dnsServers = (process.env.MONGO_DNS_SERVERS || '1.1.1.1,8.8.8.8')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (dnsServers.length) {
  try { dns.setServers(dnsServers); } catch (_) { /* ignore */ }
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
  console.log(`✓ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};
