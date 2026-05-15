import { db } from "./index";
import { companies, user } from "./schema";
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

  console.log("Companies seeded.");

  console.log("Creating default admin user...");
  
  const adminId = randomUUID();
  await db.insert(user).values({
    id: adminId,
    name: "Super Admin",
    email: "admin@koperasi.com",
    emailVerified: true,
    role: "admin",
    companyId: coopId, // Default to Koperasi
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Seed complete! You can now login with admin@koperasi.com");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
