"use server";

import { db } from "@/db";
import { leaves, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function requestLeave(
  employeeId: string, 
  startDate: Date, 
  endDate: Date, 
  reason: string, 
  type: string = "annual",
  companyId: string
) {
  try {
    await db.insert(leaves).values({
      id: randomUUID(),
      employeeId,
      companyId,
      startDate,
      endDate,
      reason,
      type,
      status: "menunggu",
      createdAt: new Date(),
    });
    return { success: true, message: "Pengajuan cuti berhasil dibuat" };
  } catch (error) {
    return { success: false, message: "Gagal mengajukan cuti", error };
  }
}

export async function updateLeaveStatus(leaveId: string, status: "menunggu" | "disetujui" | "ditolak") {
  try {
    await db.update(leaves)
      .set({ status })
      .where(eq(leaves.id, leaveId));
    return { success: true, message: `Status cuti diperbarui menjadi ${status}` };
  } catch (error) {
    return { success: false, message: "Gagal memperbarui status cuti", error };
  }
}

export async function getLeavesByEmployee(employeeId: string) {
  try {
    const data = await db.select().from(leaves).where(eq(leaves.employeeId, employeeId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data cuti", error };
  }
}

export async function getAllLeaves(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: [] };
    const data = await db.select({
      id: leaves.id,
      employeeName: employees.name,
      startDate: leaves.startDate,
      endDate: leaves.endDate,
      reason: leaves.reason,
      type: leaves.type,
      status: leaves.status,
    })
    .from(leaves)
    .leftJoin(employees, eq(leaves.employeeId, employees.id))
    .where(eq(leaves.companyId, companyId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil semua data cuti", error };
  }
}
