"use server";

import { db } from "@/db";
import { sppds, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function requestSppd(
  employeeId: string, 
  origin: string,
  destination: string, 
  departureDate: Date, 
  returnDate: Date, 
  purpose: string,
  totalCost: number = 0,
  budgets: any = {},
  companyId: string
) {
  try {
    await db.insert(sppds).values({
      id: randomUUID(),
      employeeId,
      companyId,
      origin,
      destination,
      departureDate,
      returnDate,
      purpose,
      dailyAllowance: budgets.daily || 0,
      transportCost: budgets.transport || 0,
      hotelCost: budgets.hotel || 0,
      otherCost: budgets.other || 0,
      totalCost,
      status: "menunggu",
      createdAt: new Date(),
    });
    return { success: true, message: "Pengajuan SPPD berhasil dibuat" };
  } catch (error) {
    return { success: false, message: "Gagal mengajukan SPPD", error };
  }
}

export async function updateSppdStatus(sppdId: string, status: "menunggu" | "disetujui" | "ditolak", totalCost?: number) {
  try {
    const updateData: any = { status };
    if (totalCost !== undefined) {
      updateData.totalCost = totalCost;
    }
    await db.update(sppds)
      .set(updateData)
      .where(eq(sppds.id, sppdId));
    return { success: true, message: `Status SPPD diperbarui menjadi ${status}` };
  } catch (error) {
    return { success: false, message: "Gagal memperbarui status SPPD", error };
  }
}

export async function getSppdsByEmployee(employeeId: string) {
  try {
    const data = await db.select().from(sppds).where(eq(sppds.employeeId, employeeId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data SPPD", error };
  }
}
export async function getAllSppds(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: [] };
    const data = await db.select({
      id: sppds.id,
      origin: sppds.origin,
      destination: sppds.destination,
      departureDate: sppds.departureDate,
      returnDate: sppds.returnDate,
      purpose: sppds.purpose,
      dailyAllowance: sppds.dailyAllowance,
      transportCost: sppds.transportCost,
      hotelCost: sppds.hotelCost,
      otherCost: sppds.otherCost,
      totalCost: sppds.totalCost,
      status: sppds.status,
      employeeName: employees.name,
    })
    .from(sppds)
    .leftJoin(employees, eq(sppds.employeeId, employees.id))
    .where(eq(sppds.companyId, companyId));
    
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data semua SPPD", error };
  }
}
