import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { companies } from './src/db/schema';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  try {
    const existing = await db.select().from(companies);
    if (existing.length === 0) {
      await db.insert(companies).values([
        { id: 'WKI', name: 'PT Wira Karya Indonesia', createdAt: new Date() },
        { id: 'WKS', name: 'PT Wira Karya Sinergi', createdAt: new Date() },
        { id: 'KOWIKA', name: 'Koperasi Wira Karyawan', createdAt: new Date() }
      ]);
      console.log('Database Supabase berhasil di-seed dengan data perusahaan.');
    } else {
      console.log('Data perusahaan sudah ada:', existing);
    }
  } catch (e) {
    console.error('Gagal seeding:', e);
  } finally {
    process.exit(0);
  }
}
seed();
