"use server";

import { db } from "@/db";
import { attendances, employees } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function clockIn(employeeId: string, locationGps: string, biometricValid: boolean, companyId?: string, photo?: string) {
  try {
    // Guard against duplicate clock-ins. Bound "today" in WIB (UTC+7) so the
    // day matches the user's local calendar day regardless of server timezone.
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    const now = new Date();
    const wibNow = new Date(now.getTime() + WIB_OFFSET_MS);
    const startOfToday = new Date(
      Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()) - WIB_OFFSET_MS
    );
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const todays = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.employeeId, employeeId),
          gte(attendances.clockIn, startOfToday),
          lte(attendances.clockIn, endOfToday)
        )
      );

    // Still has an unfinished session → must clock out first.
    if (todays.some((a) => a.clockIn && !a.clockOut)) {
      return { success: false, message: "Anda masih dalam sesi absen (belum clock-out). Silakan clock-out dulu." };
    }
    // Already has a record today → one attendance session per day.
    if (todays.length > 0) {
      return { success: false, message: "Anda sudah melakukan absensi hari ini." };
    }

    await db.insert(attendances).values({
      id: randomUUID(),
      employeeId,
      companyId,
      clockIn: new Date(),
      locationGps,
      photo,
      biometricValid,
      createdAt: new Date(),
    });
    return { success: true, message: "Clock-in berhasil" };
  } catch (error) {
    return { success: false, message: "Gagal clock-in", error };
  }
}

export async function clockOut(attendanceId: string) {
  try {
    await db.update(attendances)
      .set({ clockOut: new Date() })
      .where(eq(attendances.id, attendanceId));
    return { success: true, message: "Clock-out berhasil" };
  } catch (error) {
    return { success: false, message: "Gagal clock-out", error };
  }
}

export async function getAttendancesByEmployee(employeeId: string) {
  try {
    const data = await db.select().from(attendances).where(eq(attendances.employeeId, employeeId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data kehadiran", error };
  }
}

export async function getAllAttendances(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: [] };
    const data = await db.select({
      id: attendances.id,
      employeeName: employees.name,
      clockIn: attendances.clockIn,
      clockOut: attendances.clockOut,
      locationGps: attendances.locationGps,
      photo: attendances.photo,
      biometricValid: attendances.biometricValid,
    })
    .from(attendances)
    .leftJoin(employees, eq(attendances.employeeId, employees.id))
    .where(eq(attendances.companyId, companyId))
    .orderBy(desc(attendances.clockIn));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil semua data kehadiran", error };
  }
}
