// server/src/models/Branch.js
import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    hours: { type: String, default: '10:00 AM – 9:00 PM, all days' },
    lat: { type: Number },
    lng: { type: Number },
    services: { type: [String], default: ['Sales', 'Service', 'Trade-in'] },
  },
  { timestamps: true }
);

export default mongoose.model('Branch', branchSchema);
