import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripzobox';

async function wipeDatabase() {
  console.log('[Wipe] Connecting to database...');
  const conn = await mongoose.connect(uri);
  const db = conn.connection.db;
  if (!db) throw new Error('Database handle is undefined');

  console.log(`[Wipe] Target database: ${db.databaseName}`);

  const collections = await db.listCollections().toArray();
  console.log(`[Wipe] Found ${collections.length} collections.`);

  let totalDeleted = 0;

  for (const col of collections) {
    const c = db.collection(col.name);
    const beforeCount = await c.countDocuments();
    if (beforeCount > 0) {
      const res = await c.deleteMany({});
      totalDeleted += res.deletedCount;
      console.log(`[Wipe] Cleared ${col.name}: deleted ${res.deletedCount} documents.`);
    } else {
      console.log(`[Wipe] Collection ${col.name} was already empty (0 documents).`);
    }
  }

  console.log(`\n✅ [Wipe Complete] Successfully wiped ${totalDeleted} records across ${collections.length} collections.`);
  
  // Verify all counts are now 0
  console.log('[Wipe] Verifying all collection counts...');
  let remainingDocs = 0;
  for (const col of collections) {
    const c = db.collection(col.name);
    const count = await c.countDocuments();
    if (count !== 0) {
      console.error(`⚠️ Warning: ${col.name} still has ${count} documents!`);
      remainingDocs += count;
    }
  }

  if (remainingDocs === 0) {
    console.log('✅ [Verification Passed] All collections confirmed 100% EMPTY (0 documents).');
  } else {
    throw new Error(`Verification failed: ${remainingDocs} documents remain!`);
  }

  await mongoose.disconnect();
}

wipeDatabase().catch((err) => {
  console.error('❌ [Wipe] Error wiping database:', err);
  process.exit(1);
});
