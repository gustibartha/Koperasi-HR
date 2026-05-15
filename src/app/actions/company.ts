"use server";

import { db } from "@/db";
import { companies } from "@/db/schema";

export async function getCompanies() {
  try {
    const data = await db.select().from(companies);
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data perusahaan", error };
  }
}
