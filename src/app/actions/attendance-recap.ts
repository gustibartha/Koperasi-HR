"use server";

import { db } from "@/db";
import { employees, attendances, leaves } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// Same rates/rules used by payroll (calculateAndGeneratePayroll) so this recap
// matches exactly the attendance-based deductions that flow into salary.
const DEDUCTION_PER_MINUTE = 5000; // Rp per minute late
const ALPHA_RATE = 150000; // Rp per absent (alpha) working day
const LEAVE_RATE = 100000; // Rp per approved paid-leave/permit day (annual/important/unpaid)
// Late deduction starts at shift start 07:30, matching the attendance page display.
const SHIFT_START_HOUR = 7;
const SHIFT_START_MINUTE = 30;

// All day/time reasoning is done in WIB (UTC+7) so it matches what employees
// see in the browser, regardless of the server's own timezone (UTC on Vercel).
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const SHIFT_MIN = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE; // minutes since midnight
const wibDayStr = (d: Date) => new Date(d.getTime() + WIB_OFFSET_MS).toISOString().split("T")[0];
const wibMinutesOfDay = (d: Date) => {
  const w = new Date(d.getTime() + WIB_OFFSET_MS);
  return w.getUTCHours() * 60 + w.getUTCMinutes();
};

export type RecapRow = {
  employeeId: string;
  name: string;
  position: string;
  presentDays: number;
  workingDays: number;
  lateMinutes: number;
  lateDays: number;
  lateDeduction: number;
  alphaDays: number;
  alphaDeduction: number;
  leaveDays: number;
  leaveDeduction: number;
  totalDeduction: number;
};

export async function getAttendanceRecap(companyId?: string, month?: string) {
  try {
    if (!companyId || !month) return { success: true, data: [] as RecapRow[] };

    const [year, m] = month.split("-").map(Number);
    const startOfMonth = new Date(year, m - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, m, 0, 23, 59, 59);

    const [emps, atts, lvs] = await Promise.all([
      db.select().from(employees).where(eq(employees.companyId, companyId)),
      db
        .select()
        .from(attendances)
        .where(
          and(
            eq(attendances.companyId, companyId),
            gte(attendances.clockIn, startOfMonth),
            lte(attendances.clockIn, endOfMonth)
          )
        ),
      db
        .select()
        .from(leaves)
        .where(
          and(
            eq(leaves.companyId, companyId),
            eq(leaves.status, "disetujui"),
            gte(leaves.startDate, startOfMonth),
            lte(leaves.startDate, endOfMonth)
          )
        ),
    ]);

    // Working days of the month in WIB (exclude weekends). Build the list of
    // WIB day strings up front so present/leave/alpha all compare consistently.
    const daysInMonth = new Date(year, m, 0).getDate();
    const workingDayStrs: string[] = [];
    for (let dn = 1; dn <= daysInMonth; dn++) {
      const dayDate = new Date(Date.UTC(year, m - 1, dn));
      const w = dayDate.getUTCDay();
      if (w !== 0 && w !== 6) {
        workingDayStrs.push(`${year}-${String(m).padStart(2, "0")}-${String(dn).padStart(2, "0")}`);
      }
    }
    const workingDays = workingDayStrs.length;

    const data: RecapRow[] = emps.map((emp) => {
      const empAtts = atts.filter((a) => a.employeeId === emp.id && a.clockIn);

      // Present dates + lateness (all in WIB)
      const presentDates = new Set<string>();
      let lateMinutes = 0;
      let lateDays = 0;
      empAtts.forEach((a) => {
        const ci = new Date(a.clockIn as Date);
        presentDates.add(wibDayStr(ci));
        const mod = wibMinutesOfDay(ci);
        if (mod > SHIFT_MIN) {
          lateMinutes += mod - SHIFT_MIN;
          lateDays++;
        }
      });

      // Approved leave dates + paid-leave deduction
      const leaveDates = new Set<string>();
      let leaveDays = 0;
      let leaveDeduction = 0;
      lvs
        .filter((l) => l.employeeId === emp.id)
        .forEach((l) => {
          const s = new Date(l.startDate);
          const e = new Date(l.endDate);
          const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          leaveDays += diff;
          for (let i = 0; i < diff; i++) {
            const dd = new Date(s.getTime() + i * 24 * 60 * 60 * 1000);
            leaveDates.add(wibDayStr(dd));
          }
          if (l.type === "annual" || l.type === "important" || l.type === "unpaid") {
            leaveDeduction += diff * LEAVE_RATE;
          }
        });

      // Alpha = working days with neither attendance nor approved leave
      let alphaDays = 0;
      for (const ds of workingDayStrs) {
        if (!presentDates.has(ds) && !leaveDates.has(ds)) alphaDays++;
      }

      const lateDeduction = lateMinutes * DEDUCTION_PER_MINUTE;
      const alphaDeduction = alphaDays * ALPHA_RATE;

      return {
        employeeId: emp.id,
        name: emp.name,
        position: emp.position,
        presentDays: presentDates.size,
        workingDays,
        lateMinutes,
        lateDays,
        lateDeduction,
        alphaDays,
        alphaDeduction,
        leaveDays,
        leaveDeduction,
        totalDeduction: lateDeduction + alphaDeduction + leaveDeduction,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("RECAP_ERROR:", error);
    return { success: false, message: "Gagal mengambil rekap absensi", error, data: [] as RecapRow[] };
  }
}
