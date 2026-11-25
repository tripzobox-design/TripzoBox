import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripzobox';
const backupDir = path.resolve(process.cwd(), 'backups', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`);

async function backup() {
  console.log(`[Backup] Connecting to database...`);
  const conn = await mongoose.connect(uri);
  const db = conn.connection.db;
  if (!db) throw new Error('Database handle is undefined');

  const dbName = db.databaseName;
  console.log(`[Backup] Target Database: ${dbName}`);
  console.log(`[Backup] Output Directory: ${backupDir}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collections = await db.listCollections().toArray();
  const manifest: any = {
    database: dbName,
    createdAt: new Date().toISOString(),
    collections: {},
    totalDocuments: 0,
  };

  for (const col of collections) {
    const c = db.collection(col.name);
    const count = await c.countDocuments();
    const indexes = await c.indexes();
    const docs = await c.find({}).toArray();

    manifest.totalDocuments += count;
    manifest.collections[col.name] = {
      count,
      indexes,
      fileName: `${col.name}.json`,
    };

    const filePath = path.join(backupDir, `${col.name}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
    console.log(`[Backup] Dumped ${col.name}: ${docs.length} documents.`);
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`[Backup] Manifest written to ${manifestPath}`);

  // Verification step
  console.log(`\n[Backup] Verifying backup integrity...`);
  let verifiedDocs = 0;
  for (const [colName, info] of Object.entries(manifest.collections) as [string, any][]) {
    const filePath = path.join(backupDir, info.fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Verification failed: missing file ${filePath}`);
    }
    const readDocs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (readDocs.length !== info.count) {
      throw new Error(`Verification failed for ${colName}: expected ${info.count}, read ${readDocs.length}`);
    }
    verifiedDocs += readDocs.length;
  }

  if (verifiedDocs !== manifest.totalDocuments) {
    throw new Error(`Verification failed: total docs mismatch (${verifiedDocs} vs ${manifest.totalDocuments})`);
  }

  console.log(`✅ [Backup Verified] All ${collections.length} collections and ${verifiedDocs} documents verified successfully!`);
  console.log(`Backup Location: ${backupDir}`);

  await mongoose.disconnect();
}

backup().catch((err) => {
  console.error('❌ [Backup] Error:', err);
  process.exit(1);
});
