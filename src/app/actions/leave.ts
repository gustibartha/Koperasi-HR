"use server";

import { db } from "@/db";
import { leaves, employees } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { SICK_TYPES, IMPORTANT_TYPES } from "@/lib/leave-constants";

export async function requestLeave(
  employeeId: string,
  startDate: Date,
  endDate: Date,
  reason: string,
  type: string = "annual",
  companyId: string,
  attachment?: { dataUrl: string; fileName: string } | null
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
      attachment: attachment?.dataUrl ?? null,
      attachmentName: attachment?.fileName ?? null,
      createdAt: new Date(),
    });
    return { success: true, message: "Pengajuan cuti berhasil dibuat" };
  } catch (error) {
    return { success: false, message: "Gagal mengajukan cuti", error };
  }
}

// Fetch a single leave's attachment on demand (kept out of list queries to
// avoid re-sending potentially large base64 data on every page load).
export async function getLeaveAttachment(leaveId: string) {
  try {
    const rows = await db
      .select({ attachment: leaves.attachment, attachmentName: leaves.attachmentName })
      .from(leaves)
      .where(eq(leaves.id, leaveId))
      .limit(1);
    return { success: true, attachment: rows[0]?.attachment ?? null, attachmentName: rows[0]?.attachmentName ?? null };
  } catch (error) {
    return { success: false, attachment: null, attachmentName: null, message: "Gagal mengambil lampiran" };
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

// Inclusive day count between two dates
function dayCount(start: Date, end: Date) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.floor(ms / 86400000) + 1);
}

/**
 * Computes leave balances per employee from APPROVED (disetujui) leaves.
 * Returns a map keyed by employeeId.
 */
export async function getLeaveBalances(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: {} as Record<string, any> };

    const rows = await db.select({
      employeeId: leaves.employeeId,
      startDate: leaves.startDate,
      endDate: leaves.endDate,
      type: leaves.type,
      status: leaves.status,
    })
    .from(leaves)
    .where(eq(leaves.companyId, companyId));

    const balances: Record<string, { annualUsed: number; sickUsed: number; importantCount: number }> = {};

    for (const r of rows) {
      if (r.status !== "disetujui") continue;
      if (!balances[r.employeeId]) {
        balances[r.employeeId] = { annualUsed: 0, sickUsed: 0, importantCount: 0 };
      }
      const days = dayCount(r.startDate, r.endDate);
      const type = r.type || "annual";
      if (SICK_TYPES.includes(type)) {
        balances[r.employeeId].sickUsed += days;
      } else if (IMPORTANT_TYPES.includes(type)) {
        balances[r.employeeId].importantCount += 1;
      } else if (type === "annual") {
        // Only explicit annual-leave (Cuti Tahunan) usage reduces the quota.
        balances[r.employeeId].annualUsed += days;
      }
      // Any other/unrecognized izin type is approved leave (excused absence,
      // handled separately for payroll/alpha purposes) but must NOT reduce
      // the annual leave quota — only actual cuti tahunan usage does.
    }

    return { success: true, data: balances };
  } catch (error) {
    return { success: false, message: "Gagal menghitung saldo cuti", error };
  }
}

export async function getAllLeaves(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: [] };
    // NOTE: never select the `attachment` column here — it can be sizeable
    // base64 and this list is fetched on every page load. Just flag its
    // presence; load the actual file on demand via getLeaveAttachment.
    const data = await db.select({
      id: leaves.id,
      employeeId: leaves.employeeId,
      employeeName: employees.name,
      startDate: leaves.startDate,
      endDate: leaves.endDate,
      reason: leaves.reason,
      type: leaves.type,
      status: leaves.status,
      hasAttachment: sql<boolean>`${leaves.attachment} is not null`,
      attachmentName: leaves.attachmentName,
    })
    .from(leaves)
    .leftJoin(employees, eq(leaves.employeeId, employees.id))
    .where(eq(leaves.companyId, companyId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil semua data cuti", error };
  }
}
