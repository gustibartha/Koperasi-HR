import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { employees } from './src/db/schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

(async () => {
  try {
    // Update admin status for each entity

    // KOWIKA - Andri Eko Mardani (8203004KOP) should be admin
    await db.update(employees)
      .set({ role: 'admin' })
      .where(eq(employees.id, '8203004KOP'));
    console.log('✅ Kowika Admin: Andri Eko Mardani set to admin');

    // WKI - Yesi Budi Indriani (9926263WKI) should be admin
    await db.update(employees)
      .set({ role: 'admin' })
      .where(eq(employees.id, '9926263WKI'));
    console.log('✅ WKI Admin: Yesi Budi Indriani set to admin');

    // WKS - Salsa Elsi Salfarilla (0225003WKS) should be admin
    await db.update(employees)
      .set({ role: 'admin' })
      .where(eq(employees.id, '0225003WKS'));
    console.log('✅ WKS Admin: Salsa Elsi Salfarilla set to admin');

    // WKS - Ardianto (8225001WKS) should be karyawan (not admin)
    await db.update(employees)
      .set({ role: 'karyawan' })
      .where(eq(employees.id, '8225001WKS'));
    console.log('✅ WKS Direktur: Ardianto set to karyawan');

    console.log('\n✅ Database updated successfully!');
    console.log('\nAdmin Status Updated:');
    console.log('  KOWIKA:  Andri Eko Mardani (admin)');
    console.log('  WKI:     Yesi Budi Indriani (admin)');
    console.log('  WKS:     Salsa Elsi Salfarilla (admin)');
    console.log('  WKS:     Ardianto (karyawan)');

  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
})();
