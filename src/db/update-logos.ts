import { db } from "./index";
import { companies } from "./schema";
import { eq } from "drizzle-orm";

async function updateLogos() {
  console.log("Updating logos...");

  await db.update(companies)
    .set({ logo: "/logo-wks.jpg" })
    .where(eq(companies.name, "PT Wira Karya Sinergi"));

  await db.update(companies)
    .set({ logo: "/logo-wki.png" })
    .where(eq(companies.name, "PT Wira Karya Indonesia"));

  await db.update(companies)
    .set({ logo: "/logo-kowika.png" })
    .where(eq(companies.name, "Koperasi Wira Karyawan"));

  console.log("Logos updated successfully!");
  process.exit(0);
}

updateLogos().catch((err) => {
  console.error(err);
  process.exit(1);
});
