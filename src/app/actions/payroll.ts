"use server";

import { db } from "@/db";
import { payrolls, loans, employees, attendances, leaves } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { deductLoan } from "./loan";
import { isHoliday } from "@/lib/holidays";

export async function calculateAndGeneratePayroll(
  employeeId: string, 
  month: string, 
  basicSalary: number,
  extras: any = {},
  companyId: string
) {
  try {
    const [year, monthNum] = month.split("-").map(Number);

    // Reason about days/times in WIB (UTC+7) so results match the attendance page
    // regardless of the server's timezone (UTC on Vercel).
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    const SHIFT_START_HOUR = 7;
    const SHIFT_START_MINUTE = 30;
    const DEDUCTION_PER_MINUTE = 5000;
    const SHIFT_MIN = SHIFT_START_HOUR * 60 + SHIFT_START_MINUTE;
    const wibDayStr = (d: Date) => new Date(d.getTime() + WIB_OFFSET_MS).toISOString().split("T")[0];
    const wibMinutesOfDay = (d: Date) => {
      const w = new Date(d.getTime() + WIB_OFFSET_MS);
      return w.getUTCHours() * 60 + w.getUTCMinutes();
    };

    // Payroll cut-off period: from the 21st of the PREVIOUS month up to and
    // including the 20th of the selected month (both at WIB 00:00).
    // e.g. "Gaji Agustus" (month=2026-08) → 21 Jul 2026 – 20 Aug 2026.
    const periodStart = new Date(Date.UTC(year, monthNum - 2, 21) - WIB_OFFSET_MS);
    const periodEnd = new Date(Date.UTC(year, monthNum - 1, 21) - WIB_OFFSET_MS); // exclusive

    // PT Wira Karya Sinergi uses a fixed-tariff deduction schedule (Keterlambatan
    // & Pulang Awal) per its official SK instead of the generic per-minute rate.
    // Other companies keep the generic formula unchanged.
    const WKS_COMPANY_ID = '279bfb86-1b29-4b69-8e7c-5c9ac51a0c7e';
    const useWksTariff = companyId === WKS_COMPANY_ID;

    // Total earnings — computed early because WKS's Alfa formula (point 7 of
    // the SK) needs it: Potongan Alfa = Total Upah × 1/22 × hari tidak hadir.
    const totalEarnings = basicSalary +
      (extras.mealAllowance || 0) +
      (extras.positionAllowance || 0) +
      (extras.competencyAllowance || 0) +
      (extras.phoneAllowance || 0) +
      (extras.premi || 0) +
      (extras.overtimeAmount || 0) +
      (extras.overtimeMeal || 0);

    // 1. Calculate Attendance Deductions & Hours (no photo — keep egress low)
    const monthAttendances = await db
      .select({ clockIn: attendances.clockIn, clockOut: attendances.clockOut })
      .from(attendances).where(
      and(
        eq(attendances.employeeId, employeeId),
        gte(attendances.clockIn, periodStart),
        lt(attendances.clockIn, periodEnd)
      )
    );

    let totalLateMinutes = 0; // generic (non-WKS) companies
    let wksTariffDeduction = 0; // WKS: sum of Keterlambatan + Pulang Awal flat fees
    let totalActualWorkHours = 0;
    // WIB day-strings that count as a full Alfa day under the WKS SK even
    // though the employee did clock in (in >= 12:01, or out < 13:30).
    const wksAlfaOverrideDates = new Set<string>();

    monthAttendances.forEach(att => {
      if (!att.clockIn) return;
      const checkIn = new Date(att.clockIn);
      const modIn = wibMinutesOfDay(checkIn);
      const checkOut = att.clockOut ? new Date(att.clockOut) : null;
      const modOut = checkOut ? wibMinutesOfDay(checkOut) : null;

      if (checkOut) {
        totalActualWorkHours += (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }

      if (useWksTariff) {
        // Keterlambatan (per SK PT Wira Karya Sinergi):
        //   07.46–08.10 → Rp10.000, 08.11–09.10 → Rp20.000,
        //   09.11–12.00 → Rp30.000, 12.01+ → Dihitung Alfa.
        // Pulang Awal:
        //   15.30–16.00 → Rp10.000, 14.30–15.29 → Rp20.000,
        //   13.30–14.29 → Rp30.000, sebelum 13.30 → Dihitung Alfa.
        let isAlfaDay = false;
        let fee = 0;

        if (modIn >= 12 * 60 + 1) {
          isAlfaDay = true;
        } else if (modIn >= 7 * 60 + 46) {
          if (modIn <= 8 * 60 + 10) fee += 10000;
          else if (modIn <= 9 * 60 + 10) fee += 20000;
          else if (modIn <= 12 * 60) fee += 30000;
        }

        if (modOut !== null) {
          if (modOut < 13 * 60 + 30) {
            isAlfaDay = true;
          } else if (modOut <= 16 * 60) {
            if (modOut >= 15 * 60 + 30) fee += 10000;
            else if (modOut >= 14 * 60 + 30) fee += 20000;
            else if (modOut >= 13 * 60 + 30) fee += 30000;
          }
        }

        if (isAlfaDay) {
          wksAlfaOverrideDates.add(wibDayStr(checkIn));
        } else {
          wksTariffDeduction += fee;
        }
      } else {
        if (modIn > SHIFT_MIN) {
          totalLateMinutes += modIn - SHIFT_MIN;
        }
      }
    });

    // 2. Calculate Leave/Permit Deductions & Hours
    const monthLeaves = await db.select().from(leaves).where(
      and(
        eq(leaves.employeeId, employeeId),
        eq(leaves.status, "disetujui"),
        gte(leaves.startDate, periodStart),
        lt(leaves.startDate, periodEnd)
      )
    );

    let leaveDeduction = 0;
    const LEAVE_DEDUCTION_RATE = 100000; // Rp 100.000 per hari izin penting/tidak dibayar
    const ALPHA_DEDUCTION_RATE = 150000; // Rp 150.000 per hari alpha (lebih tinggi karena tidak izin)
    const approvedLeaveDays = new Set<string>(); // Track approved leave dates

    monthLeaves.forEach(lv => {
       const start = new Date(lv.startDate);
       const end = new Date(lv.endDate);
       const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

       // Add to work hours (8h per day)
       totalActualWorkHours += diffDays * 8;

       // Track leave dates (WIB)
       for (let i = 0; i < diffDays; i++) {
          const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
          approvedLeaveDays.add(wibDayStr(d));
       }

       // Apply deduction for certain types (including annual for simulation/policy)
       if (lv.type === "annual" || lv.type === "important" || lv.type === "unpaid") {
          leaveDeduction += diffDays * LEAVE_DEDUCTION_RATE;
       }
    });

    // 2b. Calculate Alpha (absent without approved leave) — all in WIB.
    // Under the WKS SK, a day the employee clocked in but was extremely late
    // (>=12:01) or left extremely early (<13:30) also counts as a full Alfa
    // day, so it's excluded from "present" here (see wksAlfaOverrideDates).
    let alphaDeduction = 0;
    const attendanceDates = new Set<string>();
    monthAttendances.forEach(att => {
      if (att.clockIn) {
        const ds = wibDayStr(new Date(att.clockIn));
        if (!wksAlfaOverrideDates.has(ds)) attendanceDates.add(ds);
      }
    });

    // Working days within the cut-off period in WIB (21st prev month → 20th
    // selected month, exclude weekends)
    let workingDaysInMonth = 0;
    let alphaDays = 0;
    for (
      let dd = new Date(Date.UTC(year, monthNum - 2, 21));
      dd <= new Date(Date.UTC(year, monthNum - 1, 20));
      dd.setUTCDate(dd.getUTCDate() + 1)
    ) {
      const dayOfWeek = dd.getUTCDay();
      const dateStr = dd.toISOString().split("T")[0];
      // Skip weekends and national holidays (tanggal merah) — not working days,
      // so they never count as alpha.
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(dateStr)) {
        workingDaysInMonth++;
        if (!attendanceDates.has(dateStr) && !approvedLeaveDays.has(dateStr)) {
          alphaDays++;
        }
      }
    }

    if (useWksTariff) {
      // Point 7 of the SK: Upah diterima = Total Upah − (Total Upah × 1/22 × hari tidak hadir)
      alphaDeduction = Math.round(totalEarnings * (1 / 22) * alphaDays);
    } else {
      alphaDeduction = alphaDays * ALPHA_DEDUCTION_RATE;
    }

    const lateDeduction = useWksTariff ? wksTariffDeduction : totalLateMinutes * DEDUCTION_PER_MINUTE;
    const expectedWorkHours = 22 * 8;

    // 3. Calculate Loan Deductions
    const activeLoans = await db.select().from(loans).where(
        and(eq(loans.employeeId, employeeId), eq(loans.status, "belum_lunas"))
    );

    let totalLoanDeduction = 0;
    for (const loan of activeLoans) {
        let deduction = loan.monthlyInstallment;
        if(loan.remainingAmount < deduction) {
            deduction = loan.remainingAmount;
        }
        totalLoanDeduction += deduction;
        await deductLoan(loan.id, deduction);
    }

    // totalEarnings was already computed above (needed early for the WKS Alfa formula).

    const totalDeductions = totalLoanDeduction +
      lateDeduction +
      leaveDeduction +
      alphaDeduction +
      (extras.shopDeduction || 0) +
      (extras.jamsostek || 0) +
      (extras.bpjsHealth || 0) +
      (extras.otherDeduction || 0);

    const netSalary = totalEarnings - totalDeductions;

    await db.insert(payrolls).values({
      id: randomUUID(),
      employeeId,
      companyId,
      month,
      basicSalary,
      mealAllowance: extras.mealAllowance || 0,
      positionAllowance: extras.positionAllowance || 0,
      competencyAllowance: extras.competencyAllowance || 0,
      phoneAllowance: extras.phoneAllowance || 0,
      premi: extras.premi || 0,
      overtimeAmount: extras.overtimeAmount || 0,
      overtimeMeal: extras.overtimeMeal || 0,
      loanDeduction: totalLoanDeduction,
      shopDeduction: extras.shopDeduction || 0,
      jamsostek: extras.jamsostek || 0,
      bpjsHealth: extras.bpjsHealth || 0,
      lateDeduction,
      // Note: leaveDeduction includes both approved leave deductions and alpha (absent) deductions
      leaveDeduction: leaveDeduction + alphaDeduction,
      otherDeduction: extras.otherDeduction || 0,
      actualWorkHours: Math.round(totalActualWorkHours * 10) / 10,
      expectedWorkHours,
      netSalary,
      createdAt: new Date(),
    });

    const summary = `Penggajian berhasil digenerate. Keterlambatan: Rp ${lateDeduction.toLocaleString('id-ID')}, Alpha: Rp ${alphaDeduction.toLocaleString('id-ID')}, Cuti: Rp ${leaveDeduction.toLocaleString('id-ID')}`;
    return { success: true, message: summary };
  } catch (error) {
    console.error("PAYROLL_ERROR:", error);
    return { success: false, message: "Gagal memproses penggajian: " + (error as Error).message, error };
  }
}

export async function getPayrollsByEmployee(employeeId: string) {
  try {
    const data = await db.select().from(payrolls).where(eq(payrolls.employeeId, employeeId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data penggajian", error };
  }
}
export async function getAllPayrolls(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: [] };
    const data = await db.select({
      id: payrolls.id,
      employeeName: employees.name,
      month: payrolls.month,
      basicSalary: payrolls.basicSalary,
      mealAllowance: payrolls.mealAllowance,
      positionAllowance: payrolls.positionAllowance,
      competencyAllowance: payrolls.competencyAllowance,
      phoneAllowance: payrolls.phoneAllowance,
      premi: payrolls.premi,
      overtimeAmount: payrolls.overtimeAmount,
      overtimeMeal: payrolls.overtimeMeal,
      loanDeduction: payrolls.loanDeduction,
      shopDeduction: payrolls.shopDeduction,
      jamsostek: payrolls.jamsostek,
      bpjsHealth: payrolls.bpjsHealth,
      lateDeduction: payrolls.lateDeduction,
      leaveDeduction: payrolls.leaveDeduction,
      otherDeduction: payrolls.otherDeduction,
      actualWorkHours: payrolls.actualWorkHours,
      expectedWorkHours: payrolls.expectedWorkHours,
      netSalary: payrolls.netSalary,
    })
    .from(payrolls)
    .leftJoin(employees, eq(payrolls.employeeId, employees.id))
    .where(eq(payrolls.companyId, companyId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil semua data penggajian", error };
  }
}

// Edit a payroll record after it was generated/approved. Net salary is
// recomputed from the edited components so it always stays consistent.
export async function updatePayroll(id: string, fields: {
  basicSalary?: number;
  mealAllowance?: number;
  positionAllowance?: number;
  competencyAllowance?: number;
  phoneAllowance?: number;
  premi?: number;
  overtimeAmount?: number;
  overtimeMeal?: number;
  loanDeduction?: number;
  shopDeduction?: number;
  jamsostek?: number;
  bpjsHealth?: number;
  lateDeduction?: number;
  leaveDeduction?: number;
  otherDeduction?: number;
}) {
  try {
    const n = (v: number | undefined) => (typeof v === "number" && !isNaN(v) ? v : 0);
    const earnings =
      n(fields.basicSalary) + n(fields.mealAllowance) + n(fields.positionAllowance) +
      n(fields.competencyAllowance) + n(fields.phoneAllowance) + n(fields.premi) +
      n(fields.overtimeAmount) + n(fields.overtimeMeal);
    const deductions =
      n(fields.loanDeduction) + n(fields.shopDeduction) + n(fields.jamsostek) +
      n(fields.bpjsHealth) + n(fields.lateDeduction) + n(fields.leaveDeduction) +
      n(fields.otherDeduction);
    const netSalary = earnings - deductions;

    await db.update(payrolls).set({
      basicSalary: n(fields.basicSalary),
      mealAllowance: n(fields.mealAllowance),
      positionAllowance: n(fields.positionAllowance),
      competencyAllowance: n(fields.competencyAllowance),
      phoneAllowance: n(fields.phoneAllowance),
      premi: n(fields.premi),
      overtimeAmount: n(fields.overtimeAmount),
      overtimeMeal: n(fields.overtimeMeal),
      loanDeduction: n(fields.loanDeduction),
      shopDeduction: n(fields.shopDeduction),
      jamsostek: n(fields.jamsostek),
      bpjsHealth: n(fields.bpjsHealth),
      lateDeduction: n(fields.lateDeduction),
      leaveDeduction: n(fields.leaveDeduction),
      otherDeduction: n(fields.otherDeduction),
      netSalary,
    }).where(eq(payrolls.id, id));

    return { success: true, message: "Data gaji berhasil diperbarui", netSalary };
  } catch (error) {
    console.error("UPDATE_PAYROLL_ERROR:", error);
    return { success: false, message: "Gagal memperbarui data gaji" };
  }
}

import * as XLSX from "xlsx";

export async function generatePayrollTemplate() {
  const headers = [
    "Employee ID", "Month (YYYY-MM)", "Basic Salary", 
    "Meal Allowance", "Position Allowance", "Competency Allowance", 
    "Phone Allowance", "Premi", "Overtime Amount", "Overtime Meal",
    "Shop Deduction", "Jamsostek", "BPJS Health", "Other Deduction"
  ];
  
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return { success: true, data: buf.toString("base64") };
}
