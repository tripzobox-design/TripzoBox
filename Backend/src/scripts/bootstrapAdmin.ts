import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

function parseArgs(): { email?: string; password?: string; name?: string } {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--email=')) result.email = arg.split('=')[1];
    if (arg.startsWith('--password=')) result.password = arg.split('=')[1];
    if (arg.startsWith('--name=')) result.name = arg.split('=')[1];
  }
  return {
    email: result.email || process.env.BOOTSTRAP_ADMIN_EMAIL,
    password: result.password || process.env.BOOTSTRAP_ADMIN_PASSWORD,
    name: result.name || process.env.BOOTSTRAP_ADMIN_NAME,
  };
}

export async function bootstrapAdmin() {
  const { email, password, name } = parseArgs();

  if (!email || !email.includes('@')) {
    console.error('❌ Error: Valid admin email is required.');
    console.error('Usage: npm run bootstrap:admin -- --email="admin@yourdomain.com" --password="YourSecurePassword!"');
    process.exit(1);
  }

  if (!password || password.length < 10) {
    console.error('❌ Error: Secure password with at least 10 characters is required.');
    console.error('Usage: npm run bootstrap:admin -- --email="admin@yourdomain.com" --password="YourSecurePassword!"');
    process.exit(1);
  }

  await connectDB();

  // Guard: Ensure one-time bootstrap. If a superadmin already exists, abort.
  const existingSuperadmin = await User.findOne({ role: 'superadmin' });
  if (existingSuperadmin) {
    console.error(`❌ Security Error: A Superadmin account already exists in the database (${existingSuperadmin.email}).`);
    console.error('One-time bootstrap is disabled. Manage existing administrator privileges via the Admin Console.');
    process.exit(1);
  }

  const cleanEmail = email.toLowerCase().trim();
  const adminName = (name || 'TripzoBox Administrator').trim();
  const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') || 'admin';

  const newAdmin = new User({
    id: `admin_${Date.now()}`,
    name: adminName,
    username,
    email: cleanEmail,
    password, // User pre-save hook will hash this securely with bcrypt
    role: 'superadmin',
    emailVerified: true,
    phoneVerified: false,
    stats: { trips: 0, stories: 0, followers: 0, following: 0 },
    isSuspended: false,
    mustResetPassword: false,
  });

  await newAdmin.save();
  console.log(`✅ [Bootstrap Success] Super Administrator account created successfully:`);
  console.log(`   Email: ${cleanEmail}`);
  console.log(`   Role: superadmin`);
  console.log(`   Bootstrap mechanism is now locked.`);

  process.exit(0);
}

bootstrapAdmin().catch((err) => {
  console.error('❌ Failed to bootstrap admin:', err);
  process.exit(1);
});
