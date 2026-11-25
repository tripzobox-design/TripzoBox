import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripzobox';

async function summary() {
  const conn = await mongoose.connect(uri);
  const db = conn.connection.db;
  if (!db) throw new Error('DB handle undefined');

  const collections = await db.listCollections().toArray();
  const rows = [];
  let totalDocs = 0;

  for (const col of collections) {
    const c = db.collection(col.name);
    const count = await c.countDocuments();
    totalDocs += count;
    const indexes = await c.indexes();
    rows.push({
      Collection: col.name,
      Count: count,
      Indexes: indexes.map(i => i.name).join(', ')
    });
  }

  // Sort by count descending
  rows.sort((a, b) => b.Count - a.Count);

  console.table(rows);
  console.log(`\nTOTAL COLLECTIONS: ${collections.length}`);
  console.log(`TOTAL DOCUMENTS: ${totalDocs}`);

  await mongoose.disconnect();
}

summary().catch(console.error);
