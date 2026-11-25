import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripzobox';

async function audit() {
  console.log('[Audit] Connecting to database...');
  const conn = await mongoose.connect(uri);
  const db = conn.connection.db;
  if (!db) {
    throw new Error('Database handle is undefined');
  }

  const dbName = db.databaseName;
  console.log(`[Audit] Database Name: ${dbName}`);
  
  const collections = await db.listCollections().toArray();
  console.log(`[Audit] Total Collections: ${collections.length}`);

  const report = [];
  let totalDocs = 0;

  for (const col of collections) {
    const c = db.collection(col.name);
    const count = await c.countDocuments();
    totalDocs += count;
    const indexes = await c.indexes();
    report.push({
      collection: col.name,
      documentCount: count,
      indexes: indexes.map((idx) => ({
        name: idx.name,
        key: idx.key,
        unique: !!idx.unique,
      })),
    });
  }

  console.log('--- DATABASE AUDIT REPORT ---');
  console.log(`Database: ${dbName}`);
  console.log(`Total Collections: ${collections.length}`);
  console.log(`Total Documents: ${totalDocs}`);
  console.log(JSON.stringify(report, null, 2));

  await mongoose.disconnect();
  console.log('[Audit] Disconnected.');
}

audit().catch((err) => {
  console.error('[Audit] Error:', err);
  process.exit(1);
});
