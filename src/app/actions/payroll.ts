"use server";

import { db } from "@/db";
import { payrolls, loans, employees, attendances, leaves } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { deductLoan } from "./loan";

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

    let totalLateMinutes = 0;
    let totalActualWorkHours = 0;

    monthAttendances.forEach(att => {
      if (att.clockIn) {
        const checkIn = new Date(att.clockIn);
        const mod = wibMinutesOfDay(checkIn);
        if (mod > SHIFT_MIN) {
          totalLateMinutes += mod - SHIFT_MIN;
        }

        if (att.clockOut) {
          const checkOut = new Date(att.clockOut);
          const workMs = checkOut.getTime() - checkIn.getTime();
          totalActualWorkHours += workMs / (1000 * 60 * 60);
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

    // 2b. Calculate Alpha (absent without approved leave) — all in WIB
    let alphaDeduction = 0;
    const attendanceDates = new Set<string>();
    monthAttendances.forEach(att => {
      if (att.clockIn) {
        attendanceDates.add(wibDayStr(new Date(att.clockIn)));
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
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysInMonth++;
        const dateStr = dd.toISOString().split("T")[0];
        if (!attendanceDates.has(dateStr) && !approvedLeaveDays.has(dateStr)) {
          alphaDays++;
          alphaDeduction += ALPHA_DEDUCTION_RATE;
        }
      }
    }

    const lateDeduction = totalLateMinutes * DEDUCTION_PER_MINUTE;
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

    const totalEarnings = basicSalary + 
      (extras.mealAllowance || 0) + 
      (extras.positionAllowance || 0) + 
      (extras.competencyAllowance || 0) + 
      (extras.phoneAllowance || 0) + 
      (extras.premi || 0) + 
      (extras.overtimeAmount || 0) + 
      (extras.overtimeMeal || 0);

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
