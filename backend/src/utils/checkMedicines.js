require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Medicine = require('../models/Medicine');

async function check() {
  await connectDB();

  const total = await Medicine.countDocuments();
  console.log('Total medicines in DB:', total);

  const benadryl = await Medicine.find({ brandName: /benadryl/i });
  console.log('Benadryl matches:', JSON.stringify(benadryl, null, 2));

  await mongoose.connection.close();
  process.exit(0);
}

check().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});