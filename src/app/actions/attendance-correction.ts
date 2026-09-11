"use server";

import { db } from "@/db";
import { attendanceCorrections, attendances, employees } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

// The submitted date/time is always meant as WIB wall-clock time, regardless
// of the server's own timezone (UTC on Vercel) — build the UTC instant
// explicitly instead of relying on Date#setHours (which uses server-local
// time and silently produces the wrong instant off-WIB servers).
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * "Lupa Absen" request: an employee forgot to clock in/out via the normal
 * attendance flow but was actually present. They submit the date + the
 * times they actually worked, for admin approval.
 */
export async function requestAttendanceCorrection(
  employeeId: string,
  companyId: string,
  date: Date,
  clockInTime: string, // "HH:MM" (WIB)
  clockOutTime: string | null, // "HH:MM" (WIB) or null
  reason: string
) {
  try {
    const y = date.getUTCFullYear();
    const mo = date.getUTCMonth();
    const d = date.getUTCDate();

    const [inH, inM] = clockInTime.split(":").map(Number);
    const clockIn = new Date(Date.UTC(y, mo, d, inH, inM, 0, 0) - WIB_OFFSET_MS);

    let clockOut: Date | null = null;
    if (clockOutTime) {
      const [outH, outM] = clockOutTime.split(":").map(Number);
      clockOut = new Date(Date.UTC(y, mo, d, outH, outM, 0, 0) - WIB_OFFSET_MS);
    }

    await db.insert(attendanceCorrections).values({
      id: randomUUID(),
      employeeId,
      companyId,
      date,
      clockIn,
      clockOut,
      reason,
      status: "menunggu",
      createdAt: new Date(),
    });
    return { success: true, message: "Pengajuan presensi manual berhasil dikirim ke Approval Center" };
  } catch (error) {
    console.error("REQUEST_CORRECTION_ERROR:", error);
    return { success: false, message: "Gagal mengajukan presensi manual" };
  }
}

export async function getAllAttendanceCorrections(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: [] };
    const data = await db.select({
      id: attendanceCorrections.id,
      employeeId: attendanceCorrections.employeeId,
      employeeName: employees.name,
      date: attendanceCorrections.date,
      clockIn: attendanceCorrections.clockIn,
      clockOut: attendanceCorrections.clockOut,
      reason: attendanceCorrections.reason,
      status: attendanceCorrections.status,
    })
    .from(attendanceCorrections)
    .leftJoin(employees, eq(attendanceCorrections.employeeId, employees.id))
    .where(eq(attendanceCorrections.companyId, companyId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data presensi manual", error };
  }
}

/**
 * Approve/reject a "Lupa Absen" request. On approval, a real attendance
 * record is inserted (flagged isManual) so it counts as Hadir everywhere
 * (Attendance log, Rekap Absensi, Payroll) instead of Alpha. Guards against
 * an existing attendance record for that employee/day (won't double-insert).
 */
export async function updateAttendanceCorrectionStatus(id: string, status: "menunggu" | "disetujui" | "ditolak") {
  try {
    const rows = await db.select().from(attendanceCorrections).where(eq(attendanceCorrections.id, id)).limit(1);
    const correction = rows[0];
    if (!correction) return { success: false, message: "Pengajuan tidak ditemukan" };

    await db.update(attendanceCorrections).set({ status }).where(eq(attendanceCorrections.id, id));

    if (status === "disetujui") {
      const y = correction.date.getUTCFullYear();
      const mo = correction.date.getUTCMonth();
      const d = correction.date.getUTCDate();
      const dayStart = new Date(Date.UTC(y, mo, d, 0, 0, 0, 0) - WIB_OFFSET_MS);
      const dayEnd = new Date(Date.UTC(y, mo, d, 23, 59, 59, 999) - WIB_OFFSET_MS);

      const existing = await db.select().from(attendances).where(
        and(
          eq(attendances.employeeId, correction.employeeId),
          gte(attendances.clockIn, dayStart),
          lte(attendances.clockIn, dayEnd)
        )
      );

      if (existing.length === 0) {
        await db.insert(attendances).values({
          id: randomUUID(),
          employeeId: correction.employeeId,
          companyId: correction.companyId,
          clockIn: correction.clockIn,
          clockOut: correction.clockOut,
          locationGps: null,
          isManual: true,
          biometricValid: false,
          createdAt: new Date(),
        });
      }
    }

    return { success: true, message: `Status presensi manual diperbarui menjadi ${status}` };
  } catch (error) {
    console.error("UPDATE_CORRECTION_ERROR:", error);
    return { success: false, message: "Gagal memperbarui status presensi manual" };
  }
}
