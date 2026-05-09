// server/src/models/Phone.js
import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['card', 'exchange', 'noCostEMI', 'cashback', 'discount'],
      required: true,
    },
    bank: { type: String },           // e.g. 'HDFC', 'ICICI'
    description: { type: String, required: true },
    discount: { type: Number, default: 0 },
  },
  { _id: false }
);

const specsSchema = new mongoose.Schema(
  {
    display: String,
    refreshRateHz: Number,
    cameraMP: Number,
    frontCameraMP: Number,
    batterymAh: Number,
    fastChargingW: Number,
    processor: String,
    os: String,
  },
  { _id: false }
);

const phoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    brand: { type: String, required: true, index: true, uppercase: true },
    slug: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true, index: true }, // INR
    mrp: { type: Number, required: true },
    ram: { type: Number, default: null },                  // GB
    storage: { type: Number, default: null },              // GB
    is5G: { type: Boolean, default: false },
    specs: { type: specsSchema, default: () => ({}) },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },               // gallery
    useCases: { type: [String], default: [] },             // gaming, camera, daily, photography
    offers: { type: [offerSchema], default: [] },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    inStock: { type: Boolean, default: true },
    tags: { type: [String], default: [] },                 // featured, new, bestseller
  },
  { timestamps: true }
);

// Text index for keyword search across name + brand + processor.
phoneSchema.index({ name: 'text', brand: 'text', 'specs.processor': 'text' });

export default mongoose.model('Phone', phoneSchema);
