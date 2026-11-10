import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

export async function provisionAdmin() {
  await connectDB();

  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@tripzobox.com';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@TripzoBox2026!';
  const adminName = 'TripzoBox Super Administrator';

  let existing = await User.findOne({ email: adminEmail.toLowerCase().trim() });
  if (existing) {
    existing.name = adminName;
    existing.role = 'superadmin';
    existing.password = adminPassword; // User pre-save hook will hash this once
    existing.emailVerified = true;
    existing.phoneVerified = true;
    existing.isSuspended = false;
    existing.mustResetPassword = false;
    await existing.save();
    console.log(`✅ Admin account updated: ${adminEmail} (Role: superadmin)`);
  } else {
    const newAdmin = new User({
      id: `admin_${Date.now()}`,
      name: adminName,
      username: 'tripzobox_admin',
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword, // User pre-save hook will hash this once
      role: 'superadmin',
      city: 'Bangalore',
      country: 'India',
      languages: ['English', 'Hindi'],
      phone: '+91 98765 00000',
      emailVerified: true,
      phoneVerified: true,
      birthDate: '1990-01-01',
      gender: 'male',
      travelStyle: 'Balanced',
      bio: 'Official TripzoBox Platform Super Administrator',
      travelInterests: ['Safety', 'Operations', 'Community'],
      budgetStyle: 'comfort',
      travelPace: 'Balanced',
      preferredGroupSize: '4-8 travellers',
      dreamDestination: 'Everywhere',
      stats: { trips: 0, stories: 0, followers: 0, following: 0 },
      isSuspended: false,
      mustResetPassword: false,
    });
    await newAdmin.save();
    console.log(`✅ New Admin account provisioned: ${adminEmail} (Role: superadmin)`);
  }

  process.exit(0);
}

provisionAdmin().catch((err) => {
  console.error('❌ Failed to provision admin:', err);
  process.exit(1);
});
