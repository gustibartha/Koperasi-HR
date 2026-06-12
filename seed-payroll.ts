import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { payrolls, sppds } from './src/db/schema';
import { randomUUID } from 'crypto';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const kowikaId = '22841c61-fa3d-4b79-8922-b50ece65ca70';
const fitrahId = '8222001KOP';

async function seed() {
  try {
    // Check if payroll already exists for June 2026
    const existing = await db.select().from(payrolls).where(
      (p) => {
        // Drizzle doesn't have direct field filtering in where, so we'll check after fetch
        return p;
      }
    );

    const payrollExists = existing.some((p: any) =>
      p.companyId === kowikaId &&
      p.employeeId === fitrahId &&
      p.month === '2026-06'
    );

    if (!payrollExists) {
      await db.insert(payrolls).values({
        id: randomUUID(),
        companyId: kowikaId,
        employeeId: fitrahId,
        month: '2026-06',
        basicSalary: 15000000,
        mealAllowance: 500000,
        positionAllowance: 2000000,
        competencyAllowance: 1000000,
        phoneAllowance: 150000,
        premi: 0,
        overtimeAmount: 0,
        overtimeMeal: 0,
        loanDeduction: 500000,
        shopDeduction: 100000,
        jamsostek: 450000,
        bpjsHealth: 300000,
        lateDeduction: 0,
        leaveDeduction: 0,
        otherDeduction: 100000,
        actualWorkHours: 160,
        expectedWorkHours: 160,
        netSalary: 17600000,
        createdAt: new Date(),
      } as any);
      console.log('✓ Payroll untuk Fitrah Ginanjar (Juni 2026) berhasil di-seed');
    } else {
      console.log('✓ Payroll untuk Fitrah Ginanjar (Juni 2026) sudah ada');
    }

    // Check and seed SPPD
    const sppdExisting = await db.select().from(sppds);
    const sppdExists = sppdExisting.some((s: any) =>
      s.companyId === kowikaId &&
      s.employeeId === fitrahId
    );

    if (!sppdExists) {
      await db.insert(sppds).values({
        id: randomUUID(),
        companyId: kowikaId,
        employeeId: fitrahId,
        originAirport: 'Soekarno-Hatta (Tangerang)',
        destinationAirport: 'Sultan Hasanuddin (Makassar)',
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-18'),
        reason: 'Rapat koordinasi cabang wilayah timur dan evaluasi kinerja',
        status: 'disetujui',
        transportCost: 250000,
        hotelCost: 2000000,
        dailyAllowance: 1500000,
        otherCost: 300000,
        totalCost: 4050000,
        createdAt: new Date(),
      } as any);
      console.log('✓ SPPD untuk Fitrah Ginanjar berhasil di-seed');
    } else {
      console.log('✓ SPPD untuk Fitrah Ginanjar sudah ada');
    }

  } catch (e) {
    console.error('❌ Gagal seeding payroll/sppd:', e);
  } finally {
    await client.end();
    process.exit(0);
  }
}

seed();
