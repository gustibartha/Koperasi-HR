import { db } from "./index";
import { companies, employees, attendances, leaves, loans, payrolls, performances, sppds, user } from "./schema";
import { randomUUID } from "crypto";

async function seed() {
  console.log("Seeding companies...");

  const coopId = randomUUID();
  const sinergiId = randomUUID();
  const indonesiaId = randomUUID();

  await db.insert(companies).values([
    {
      id: coopId,
      name: "Koperasi Wira Karyawan",
      address: "Jl. Industri No. 1, Jakarta",
      createdAt: new Date(),
    },
    {
      id: sinergiId,
      name: "PT Wira Karya Sinergi",
      address: "Gedung Sinergi Lt. 5, Jakarta",
      createdAt: new Date(),
    },
    {
      id: indonesiaId,
      name: "PT Wira Karya Indonesia",
      address: "Kawasan Industri Jababeka, Bekasi",
      createdAt: new Date(),
    },
  ]);

  console.log("Companies seeded. Updating existing records to Koperasi Wira Karyawan...");

  // Update all existing records to point to Koperasi as default
  await db.update(employees).set({ companyId: coopId });
  await db.update(attendances).set({ companyId: coopId });
  await db.update(leaves).set({ companyId: coopId });
  await db.update(loans).set({ companyId: coopId });
  await db.update(payrolls).set({ companyId: coopId });
  await db.update(performances).set({ companyId: coopId });
  await db.update(sppds).set({ companyId: coopId });
  await db.update(user).set({ companyId: coopId });

  console.log("Migration complete!");
}

seed().catch(console.error);
