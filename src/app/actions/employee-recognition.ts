"use server";

import { db } from "@/db";
import { employees, attendances } from "@/db/schema";
import { eq } from "drizzle-orm";

// PT Wira Karya Sinergi uses a fixed-tariff SK schedule where on-time is up to
// 07:45 (07:46+ is late) — mirrors the rule in payroll.ts / attendance-recap.ts.
const WKS_COMPANY_ID = '279bfb86-1b29-4b69-8e7c-5c9ac51a0c7e';
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const SHIFT_MIN = 7 * 60 + 30; // 07:30 generic shift start
const WKS_LATE_FROM_MIN = 7 * 60 + 46;

const wibDayStr = (d: Date) => new Date(d.getTime() + WIB_OFFSET_MS).toISOString().split("T")[0];
const wibMinutesOfDay = (d: Date) => {
  const w = new Date(d.getTime() + WIB_OFFSET_MS);
  return w.getUTCHours() * 60 + w.getUTCMinutes();
};

export type MorningStar = {
  employeeId: string;
  name: string;
  position: string;
  avgClockIn: string; // "07:17" (WIB)
  onTimeRate: number; // 0-100, overall
  worstMonthRate: number; // 0-100, lowest single-month rate (consistency floor)
  months: number;
  totalDays: number;
};

/**
 * Ranks employees by how consistently they clock in on time, every month —
 * used for the "Pegawai Teladan" recognition card on the dashboard. Ranked by
 * worst-month on-time rate first (so one bad month can't be hidden by good
 * months elsewhere), then overall on-time rate, then earliest average time.
 */
export async function getMorningStars(companyId?: string, limit: number = 2) {
  try {
    if (!companyId) return { success: true, data: [] as MorningStar[] };

    const useWks = companyId === WKS_COMPANY_ID;
    const [emps, atts] = await Promise.all([
      db.select().from(employees).where(eq(employees.companyId, companyId)),
      db
        .select({ employeeId: attendances.employeeId, clockIn: attendances.clockIn })
        .from(attendances)
        .where(eq(attendances.companyId, companyId)),
    ]);

    type MonthStat = { total: number; late: number; minutesSum: number };
    const byEmp = new Map<string, Map<string, MonthStat>>();

    atts.forEach((a) => {
      if (!a.clockIn) return;
      const ci = new Date(a.clockIn as Date);
      const monthKey = wibDayStr(ci).slice(0, 7); // YYYY-MM
      const modIn = wibMinutesOfDay(ci);
      const late = useWks ? modIn >= WKS_LATE_FROM_MIN : modIn > SHIFT_MIN;

      if (!byEmp.has(a.employeeId)) byEmp.set(a.employeeId, new Map());
      const empMonths = byEmp.get(a.employeeId)!;
      if (!empMonths.has(monthKey)) empMonths.set(monthKey, { total: 0, late: 0, minutesSum: 0 });
      const stat = empMonths.get(monthKey)!;
      stat.total++;
      if (late) stat.late++;
      stat.minutesSum += modIn;
    });

    const candidates: MorningStar[] = [];
    for (const emp of emps) {
      const empMonths = byEmp.get(emp.id);
      if (!empMonths || empMonths.size < 2) continue; // need >=2 months of data to judge consistency

      let totalDays = 0, totalLate = 0, minutesSum = 0, worstMonthRate = 1;
      for (const [, stat] of empMonths) {
        const rate = 1 - stat.late / stat.total;
        worstMonthRate = Math.min(worstMonthRate, rate);
        totalDays += stat.total;
        totalLate += stat.late;
        minutesSum += stat.minutesSum;
      }

      const avgMinutes = minutesSum / totalDays;
      const h = Math.floor(avgMinutes / 60);
      const m = Math.round(avgMinutes % 60);

      candidates.push({
        employeeId: emp.id,
        name: emp.name,
        position: emp.position,
        avgClockIn: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        onTimeRate: Math.round((1 - totalLate / totalDays) * 1000) / 10,
        worstMonthRate: Math.round(worstMonthRate * 1000) / 10,
        months: empMonths.size,
        totalDays,
      });
    }

    candidates.sort((a, b) => {
      if (b.worstMonthRate !== a.worstMonthRate) return b.worstMonthRate - a.worstMonthRate;
      if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
      return a.avgClockIn.localeCompare(b.avgClockIn);
    });

    return { success: true, data: candidates.slice(0, limit) };
  } catch (error) {
    console.error("MORNING_STARS_ERROR:", error);
    return { success: false, message: "Gagal mengambil data pegawai teladan", data: [] as MorningStar[] };
  }
}
