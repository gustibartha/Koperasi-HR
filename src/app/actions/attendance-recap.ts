"use server";

import { db } from "@/db";
import { employees, attendances, leaves, payrolls } from "@/db/schema";
import { eq, and, gte, lt, desc } from "drizzle-orm";
import { isHoliday } from "@/lib/holidays";

// Same rates/rules used by payroll (calculateAndGeneratePayroll) so this recap
// matches exactly the attendance-based deductions that flow into salary.
const DEDUCTION_PER_MINUTE = 5000; // Rp per minute late (generic/non-WKS companies)
const ALPHA_RATE = 150000; // Rp per absent (alpha) working day (generic/non-WKS)
const LEAVE_RATE = 100000; // Rp per approved paid-leave/permit day (annual/important/unpaid)
// Late deduction starts at shift start 07:30, matching the attendance page display.
const SHIFT_START_HOUR = 7;
const SHIFT_START_MINUTE = 30;

// PT Wira Karya Sinergi uses a fixed-tariff deduction schedule (Keterlambatan
// & Pulang Awal) per its official SK instead of the generic per-minute rate —
// mirrors the logic in calculateAndGeneratePayroll (src/app/actions/payroll.ts).
const WKS_COMPANY_ID = '279bfb86-1b29-4b69-8e7c-5c9ac51a0c7e';

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
  usesWksTariff: boolean;
  alphaBasisMonth: string | null; // month of the payroll row used to estimate WKS alpha (Total Upah)
};

export async function getAttendanceRecap(companyId?: string, month?: string) {
  try {
    if (!companyId || !month) return { success: true, data: [] as RecapRow[] };

    const [year, m] = month.split("-").map(Number);
    // Payroll cut-off period: from the 21st of the PREVIOUS month up to and
    // including the 20th of the selected month (both bounds at WIB 00:00).
    // e.g. "Gaji Agustus" (month=2026-08) → 21 Jul 2026 – 20 Aug 2026.
    const periodStart = new Date(Date.UTC(year, m - 2, 21) - WIB_OFFSET_MS);
    const periodEnd = new Date(Date.UTC(year, m - 1, 21) - WIB_OFFSET_MS); // exclusive (21st current, WIB 00:00)

    const useWksTariff = companyId === WKS_COMPANY_ID;

    const [emps, atts, lvs] = await Promise.all([
      db.select().from(employees).where(eq(employees.companyId, companyId)),
      db
        // Only the columns needed for the recap — never the heavy `photo` column.
        .select({
          employeeId: attendances.employeeId,
          clockIn: attendances.clockIn,
          clockOut: attendances.clockOut,
        })
        .from(attendances)
        .where(
          and(
            eq(attendances.companyId, companyId),
            gte(attendances.clockIn, periodStart),
            lt(attendances.clockIn, periodEnd)
          )
        ),
      db
        .select()
        .from(leaves)
        .where(
          and(
            eq(leaves.companyId, companyId),
            eq(leaves.status, "disetujui"),
            gte(leaves.startDate, periodStart),
            lt(leaves.startDate, periodEnd)
          )
        ),
    ]);

    // WKS's Alfa formula needs "Total Upah" (Point 7 of the SK), which lives on
    // payroll records, not the employee master. Use each employee's most recent
    // payroll as a reference/estimate for this recap (real payroll generation
    // always uses the actual figures entered at that time).
    const alphaBasisByEmployee = new Map<string, { earnings: number; month: string }>();
    if (useWksTariff) {
      for (const emp of emps) {
        const last = await db
          .select()
          .from(payrolls)
          .where(eq(payrolls.employeeId, emp.id))
          .orderBy(desc(payrolls.month))
          .limit(1);
        if (last[0]) {
          const p = last[0];
          const earnings =
            p.basicSalary + (p.mealAllowance || 0) + (p.positionAllowance || 0) +
            (p.competencyAllowance || 0) + (p.phoneAllowance || 0) + (p.premi || 0) +
            (p.overtimeAmount || 0) + (p.overtimeMeal || 0);
          alphaBasisByEmployee.set(emp.id, { earnings, month: p.month });
        }
      }
    }

    // Working days within the period (WIB, exclude weekends). Same WIB day-string
    // basis as present/leave/alpha so they compare consistently.
    const workingDayStrs: string[] = [];
    for (
      let dd = new Date(Date.UTC(year, m - 2, 21));
      dd <= new Date(Date.UTC(year, m - 1, 20));
      dd.setUTCDate(dd.getUTCDate() + 1)
    ) {
      const w = dd.getUTCDay();
      const ds = dd.toISOString().split("T")[0];
      // Exclude weekends and national holidays (tanggal merah) from working days.
      if (w !== 0 && w !== 6 && !isHoliday(ds)) workingDayStrs.push(ds);
    }
    const workingDays = workingDayStrs.length;

    const data: RecapRow[] = emps.map((emp) => {
      const empAtts = atts.filter((a) => a.employeeId === emp.id && a.clockIn);

      // Present dates + lateness (all in WIB). Under the WKS SK, a day the
      // employee clocked in extremely late (>=12:01) or left extremely early
      // (<13:30) counts as a full Alfa day instead — tracked separately.
      const presentDates = new Set<string>();
      const wksAlfaOverrideDates = new Set<string>();
      let lateMinutes = 0;
      let lateDays = 0;
      let wksTariffDeduction = 0;

      empAtts.forEach((a) => {
        const ci = new Date(a.clockIn as Date);
        const modIn = wibMinutesOfDay(ci);
        const co = a.clockOut ? new Date(a.clockOut) : null;
        const modOut = co ? wibMinutesOfDay(co) : null;

        if (useWksTariff) {
          // Keterlambatan: 07.46–08.10→Rp10rb, 08.11–09.10→Rp20rb, 09.11–12.00→Rp30rb, 12.01+→Alfa.
          // Pulang Awal: 15.30–16.00→Rp10rb, 14.30–15.29→Rp20rb, 13.30–14.29→Rp30rb, <13.30→Alfa.
          let isAlfaDay = false;
          let fee = 0;
          if (modIn >= 12 * 60 + 1) isAlfaDay = true;
          else if (modIn >= 7 * 60 + 46) {
            if (modIn <= 8 * 60 + 10) fee += 10000;
            else if (modIn <= 9 * 60 + 10) fee += 20000;
            else if (modIn <= 12 * 60) fee += 30000;
          }
          if (modOut !== null) {
            if (modOut < 13 * 60 + 30) isAlfaDay = true;
            else if (modOut <= 16 * 60) {
              if (modOut >= 15 * 60 + 30) fee += 10000;
              else if (modOut >= 14 * 60 + 30) fee += 20000;
              else if (modOut >= 13 * 60 + 30) fee += 30000;
            }
          }
          if (isAlfaDay) {
            wksAlfaOverrideDates.add(wibDayStr(ci));
          } else {
            wksTariffDeduction += fee;
            if (fee > 0) lateDays++;
            presentDates.add(wibDayStr(ci));
          }
        } else {
          presentDates.add(wibDayStr(ci));
          if (modIn > SHIFT_MIN) {
            lateMinutes += modIn - SHIFT_MIN;
            lateDays++;
          }
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

      // Alpha = working days with neither attendance (excluding WKS override
      // dates) nor approved leave
      let alphaDays = 0;
      for (const ds of workingDayStrs) {
        if (!presentDates.has(ds) && !leaveDates.has(ds)) alphaDays++;
      }

      let lateDeduction: number;
      let alphaDeduction: number;
      let alphaBasisMonth: string | null = null;
      if (useWksTariff) {
        lateDeduction = wksTariffDeduction;
        const basis = alphaBasisByEmployee.get(emp.id);
        alphaDeduction = basis ? Math.round(basis.earnings * (1 / 22) * alphaDays) : 0;
        alphaBasisMonth = basis?.month ?? null;
      } else {
        lateDeduction = lateMinutes * DEDUCTION_PER_MINUTE;
        alphaDeduction = alphaDays * ALPHA_RATE;
      }

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
        usesWksTariff: useWksTariff,
        alphaBasisMonth,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("RECAP_ERROR:", error);
    return { success: false, message: "Gagal mengambil rekap absensi", error, data: [] as RecapRow[] };
  }
}

import * as XLSX from "xlsx";

export async function exportAttendanceRecapExcel(companyId?: string, month?: string) {
  try {
    const res = await getAttendanceRecap(companyId, month);
    if (!res.success) return { success: false, message: "Gagal membuat file Excel" };

    const rows = res.data.map((r) => ({
      "Nama Pegawai": r.name,
      "Posisi": r.position,
      "Hadir": r.presentDays,
      "Hari Kerja": r.workingDays,
      "Menit Telat": r.lateMinutes,
      "Hari Telat": r.lateDays,
      "Potongan Telat (Rp)": r.lateDeduction,
      "Hari Alpha": r.alphaDays,
      "Potongan Alpha (Rp)": r.alphaDeduction,
      "Hari Cuti/Izin": r.leaveDays,
      "Potongan Cuti/Izin (Rp)": r.leaveDeduction,
      "Total Potongan (Rp)": r.totalDeduction,
      "Formula": r.usesWksTariff ? "Tarif SK PT Wira Karya Sinergi" : "Standar",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 24 }, { wch: 22 }, { wch: 8 }, { wch: 10 }, { wch: 11 }, { wch: 10 },
      { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 16 }, { wch: 26 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Absensi");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return { success: true, data: buf.toString("base64") };
  } catch (error) {
    console.error("RECAP_EXCEL_ERROR:", error);
    return { success: false, message: "Gagal membuat file Excel" };
  }
}
