require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Farmer = require('../models/Farmer');
const ProcurementCenter = require('../models/ProcurementCenter');
const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Procurement = require('../models/Procurement');
const Notification = require('../models/Notification');
const CropRate = require('../models/CropRate');

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting seed...\n');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Farmer.deleteMany({}),
      ProcurementCenter.deleteMany({}),
      Slot.deleteMany({}),
      Booking.deleteMany({}),
      Procurement.deleteMany({}),
      Notification.deleteMany({}),
      CropRate.deleteMany({}),
    ]);
    console.log('🗑️  Cleared all collections');

    // ── 1. Create Admin ──────────────────────────
    const admin = await User.create({
      name: 'Admin KisanSetu',
      mobile: '9999999999',
      password: 'admin123',
      role: 'admin',
    });
    console.log('👤 Admin created');

    // ── 2. Create Operators & Centers ─────────────
    const operatorData = [
      { name: 'Rajesh Kumar', mobile: '9111111111', password: 'operator123' },
      { name: 'Suresh Patil', mobile: '9222222222', password: 'operator123' },
      { name: 'Anita Devi', mobile: '9333333333', password: 'operator123' },
    ];

    const centerData = [
      {
        centerName: 'Pune Mandi Procurement Center',
        centerCode: 'PC-PUNE-01',
        address: 'APMC Yard, Market Road, Pune',
        district: 'Pune',
        numberOfCounters: 3,
        dailyCapacity: 500,
        operatingHours: { start: '08:00', end: '17:00' },
        cropsHandled: ['Wheat', 'Rice', 'Soybean', 'Cotton', 'Maize'],
        activeCounters: 3,
      },
      {
        centerName: 'Nashik Agri Market',
        centerCode: 'PC-NASH-01',
        address: 'Krishi Upaj Mandi, Nashik',
        district: 'Nashik',
        numberOfCounters: 2,
        dailyCapacity: 300,
        operatingHours: { start: '07:00', end: '16:00' },
        cropsHandled: ['Onion', 'Grapes', 'Tomato', 'Wheat', 'Bajra'],
        activeCounters: 2,
      },
      {
        centerName: 'Nagpur Central Mandi',
        centerCode: 'PC-NAGP-01',
        address: 'Cotton Market, Central Avenue, Nagpur',
        district: 'Nagpur',
        numberOfCounters: 4,
        dailyCapacity: 600,
        operatingHours: { start: '08:00', end: '18:00' },
        cropsHandled: ['Cotton', 'Soybean', 'Orange', 'Rice', 'Wheat'],
        activeCounters: 4,
      },
    ];

    const operators = [];
    const centers = [];

    for (let i = 0; i < operatorData.length; i++) {
      const op = await User.create({ ...operatorData[i], role: 'operator' });
      operators.push(op);

      const center = await ProcurementCenter.create({
        ...centerData[i],
        operator: op._id,
        status: 'approved',
      });
      centers.push(center);
    }
    console.log('🏢 3 Centers + Operators created');

    // ── 3. Create Farmers ────────────────────────
    const farmerUsers = [
      { name: 'Ramesh Sharma', mobile: '9811111111', password: 'farmer123', village: 'Khandala', district: 'Pune', landSize: 5, mainCrops: ['Wheat', 'Rice'] },
      { name: 'Lakshmi Bai', mobile: '9811111112', password: 'farmer123', village: 'Igatpuri', district: 'Nashik', landSize: 3, mainCrops: ['Onion', 'Tomato'] },
      { name: 'Shankar Patil', mobile: '9811111113', password: 'farmer123', village: 'Phaltan', district: 'Pune', landSize: 8, mainCrops: ['Soybean', 'Cotton'] },
      { name: 'Geeta Devi', mobile: '9811111114', password: 'farmer123', village: 'Shirdi', district: 'Nashik', landSize: 2, mainCrops: ['Grapes', 'Onion'] },
      { name: 'Manoj Jadhav', mobile: '9811111115', password: 'farmer123', village: 'Wardha', district: 'Nagpur', landSize: 10, mainCrops: ['Cotton', 'Soybean'] },
      { name: 'Sunita Wagh', mobile: '9811111116', password: 'farmer123', village: 'Latur', district: 'Pune', landSize: 4, mainCrops: ['Wheat', 'Maize'] },
      { name: 'Babu Rao', mobile: '9811111117', password: 'farmer123', village: 'Akola', district: 'Nagpur', landSize: 6, mainCrops: ['Cotton', 'Orange'] },
      { name: 'Kamala Devi', mobile: '9811111118', password: 'farmer123', village: 'Deolali', district: 'Nashik', landSize: 3, mainCrops: ['Tomato', 'Bajra'] },
      { name: 'Vijay Singh', mobile: '9811111119', password: 'farmer123', village: 'Junnar', district: 'Pune', landSize: 7, mainCrops: ['Rice', 'Soybean'] },
      { name: 'Asha Kumari', mobile: '9811111120', password: 'farmer123', village: 'Katol', district: 'Nagpur', landSize: 5, mainCrops: ['Wheat', 'Rice'] },
    ];

    const farmers = [];
    for (const fd of farmerUsers) {
      const user = await User.create({
        name: fd.name,
        mobile: fd.mobile,
        password: fd.password,
        role: 'farmer',
        preferredLanguage: ['en', 'hi', 'mr'][Math.floor(Math.random() * 3)],
      });

      const farmer = await Farmer.create({
        user: user._id,
        village: fd.village,
        district: fd.district,
        landSize: fd.landSize,
        mainCrops: fd.mainCrops,
      });

      farmers.push({ user, farmer });
    }
    console.log('👨‍🌾 10 Farmers created');

    // ── 4. Create Slots for today and tomorrow ───
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const slotTemplates = [
      { start: '08:00', end: '10:00' },
      { start: '10:00', end: '12:00' },
      { start: '12:00', end: '14:00' },
      { start: '14:00', end: '16:00' },
    ];

    const allSlots = [];
    for (const center of centers) {
      for (const day of [today, tomorrow]) {
        for (const template of slotTemplates) {
          const slot = await Slot.create({
            center: center._id,
            date: day,
            timeSlot: template,
            maxCapacity: 15,
            currentBookings: 0,
            isAvailable: true,
          });
          allSlots.push(slot);
        }
      }
    }
    console.log(`📅 ${allSlots.length} Slots created (today + tomorrow for 3 centers)`);

    // ── 5. Create Sample Bookings for today ──────
    const bookingData = [
      { farmerIdx: 0, centerIdx: 0, slotIdx: 0, crop: 'Wheat', qty: 10, status: 'booked' },
      { farmerIdx: 1, centerIdx: 1, slotIdx: 4, crop: 'Onion', qty: 15, status: 'booked' },
      { farmerIdx: 2, centerIdx: 0, slotIdx: 1, crop: 'Soybean', qty: 8, status: 'in-queue' },
      { farmerIdx: 3, centerIdx: 1, slotIdx: 5, crop: 'Tomato', qty: 5, status: 'booked' },
      { farmerIdx: 4, centerIdx: 2, slotIdx: 8, crop: 'Cotton', qty: 20, status: 'checked-in' },
      { farmerIdx: 5, centerIdx: 0, slotIdx: 2, crop: 'Maize', qty: 12, status: 'booked' },
    ];

    const bookings = [];
    for (let i = 0; i < bookingData.length; i++) {
      const bd = bookingData[i];
      const f = farmers[bd.farmerIdx];
      const slot = allSlots[bd.slotIdx];

      const booking = await Booking.create({
        farmer: f.farmer._id,
        user: f.user._id,
        center: centers[bd.centerIdx]._id,
        slot: slot._id,
        date: today,
        cropCategory: bd.crop === 'Cotton' ? 'Cash Crops' : bd.crop === 'Onion' || bd.crop === 'Tomato' ? 'Vegetables' : 'Food Grains',
        cropName: bd.crop,
        declaredQuantity: bd.qty,
        status: bd.status,
        queuePosition: bd.status === 'in-queue' || bd.status === 'checked-in' ? i + 1 : null,
        stageTimestamps: {
          booked: new Date(),
          ...(bd.status === 'checked-in' ? { checkedIn: new Date() } : {}),
          ...(bd.status === 'in-queue' ? { checkedIn: new Date(), inQueue: new Date() } : {}),
        },
      });

      slot.currentBookings += 1;
      await slot.save();
      bookings.push(booking);
    }
    console.log(`📋 ${bookings.length} Sample bookings created`);

    // ── 6. MSP / Crop Rate Table ─────────────────
    const cropRates = [
      { cropCategory: 'Food Grains', cropName: 'Wheat', mspRate: 2275, gradeARate: 2400, gradeBRate: 2275, gradeCRate: 2100, season: 'rabi' },
      { cropCategory: 'Food Grains', cropName: 'Rice', mspRate: 2203, gradeARate: 2350, gradeBRate: 2203, gradeCRate: 2050, season: 'kharif' },
      { cropCategory: 'Food Grains', cropName: 'Maize', mspRate: 2090, gradeARate: 2200, gradeBRate: 2090, gradeCRate: 1950, season: 'kharif' },
      { cropCategory: 'Food Grains', cropName: 'Bajra', mspRate: 2500, gradeARate: 2650, gradeBRate: 2500, gradeCRate: 2350, season: 'kharif' },
      { cropCategory: 'Oilseeds', cropName: 'Soybean', mspRate: 4600, gradeARate: 4800, gradeBRate: 4600, gradeCRate: 4350, season: 'kharif' },
      { cropCategory: 'Cash Crops', cropName: 'Cotton', mspRate: 7020, gradeARate: 7300, gradeBRate: 7020, gradeCRate: 6700, season: 'kharif' },
      { cropCategory: 'Vegetables', cropName: 'Onion', mspRate: 1200, gradeARate: 1500, gradeBRate: 1200, gradeCRate: 900, season: 'all' },
      { cropCategory: 'Vegetables', cropName: 'Tomato', mspRate: 800, gradeARate: 1100, gradeBRate: 800, gradeCRate: 600, season: 'all' },
      { cropCategory: 'Fruits', cropName: 'Grapes', mspRate: 3500, gradeARate: 4000, gradeBRate: 3500, gradeCRate: 3000, season: 'all' },
      { cropCategory: 'Fruits', cropName: 'Orange', mspRate: 2800, gradeARate: 3200, gradeBRate: 2800, gradeCRate: 2400, season: 'all' },
    ];

    await CropRate.insertMany(cropRates);
    console.log('💰 10 Crop rates (MSP) created');

    // ── 7. Past Procurement Data (7 days) ────────
    const pastProcurements = [];
    for (let daysAgo = 7; daysAgo >= 1; daysAgo--) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - daysAgo);
      pastDate.setHours(0, 0, 0, 0);

      const numProcurements = Math.floor(Math.random() * 5) + 3; // 3-7 per day

      for (let j = 0; j < numProcurements; j++) {
        const farmerData = farmers[Math.floor(Math.random() * farmers.length)];
        const center = centers[Math.floor(Math.random() * centers.length)];
        const crop = cropRates[Math.floor(Math.random() * cropRates.length)];
        const grade = ['A', 'B', 'C'][Math.floor(Math.random() * 3)];
        const weight = Math.round((Math.random() * 15 + 2) * 10) / 10;
        const rate = grade === 'A' ? crop.gradeARate : grade === 'B' ? crop.gradeBRate : crop.gradeCRate;

        // Create a past booking
        const pastBooking = await Booking.create({
          farmer: farmerData.farmer._id,
          user: farmerData.user._id,
          center: center._id,
          slot: allSlots[0]._id, // reuse slot ref
          date: pastDate,
          cropCategory: crop.cropCategory,
          cropName: crop.cropName,
          declaredQuantity: weight,
          status: 'completed',
          stageTimestamps: {
            booked: pastDate,
            checkedIn: new Date(pastDate.getTime() + 30 * 60000),
            inQueue: new Date(pastDate.getTime() + 35 * 60000),
            called: new Date(pastDate.getTime() + 60 * 60000),
            weighing: new Date(pastDate.getTime() + 70 * 60000),
            qualityCheck: new Date(pastDate.getTime() + 80 * 60000),
            payment: new Date(pastDate.getTime() + 90 * 60000),
            completed: new Date(pastDate.getTime() + 100 * 60000),
          },
        });

        const checkInDuration = Math.floor(Math.random() * 15) + 3;
        const weighingDuration = Math.floor(Math.random() * 10) + 3;
        const qcDuration = Math.floor(Math.random() * 8) + 2;
        const paymentDuration = Math.floor(Math.random() * 10) + 2;

        await Procurement.create({
          booking: pastBooking._id,
          farmer: farmerData.farmer._id,
          center: center._id,
          cropName: crop.cropName,
          declaredWeight: weight,
          actualWeight: Math.round((weight + (Math.random() - 0.5) * 2) * 10) / 10,
          qualityGrade: grade,
          ratePerQuintal: rate,
          totalAmount: Math.round(weight * rate),
          paymentStatus: Math.random() > 0.3 ? 'processed' : 'pending',
          paymentDate: Math.random() > 0.3 ? new Date(pastDate.getTime() + 120 * 60000) : null,
          stageDurations: {
            checkIn: checkInDuration,
            weighing: weighingDuration,
            qualityCheck: qcDuration,
            payment: paymentDuration,
            total: checkInDuration + weighingDuration + qcDuration + paymentDuration,
          },
          createdAt: pastDate,
        });
      }
    }
    console.log('📊 7 days of past procurement data created');

    // ── Print credentials ─────────────────────────
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               🌾 DEMO LOGIN CREDENTIALS 🌾                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  👑 ADMIN                                                    ║
║     Mobile: 9999999999    Password: admin123                 ║
║                                                              ║
║  🏢 OPERATORS (Center)                                       ║
║     Rajesh Kumar  │ 9111111111 │ operator123                 ║
║     Suresh Patil  │ 9222222222 │ operator123                 ║
║     Anita Devi    │ 9333333333 │ operator123                 ║
║                                                              ║
║  👨‍🌾 FARMERS (use any)                                       ║
║     Ramesh Sharma │ 9811111111 │ farmer123                   ║
║     Lakshmi Bai   │ 9811111112 │ farmer123                   ║
║     Shankar Patil │ 9811111113 │ farmer123                   ║
║     ... (10 farmers total, password: farmer123)              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    console.log('\n✅ Seed completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
