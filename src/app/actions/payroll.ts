"use server";

import { db } from "@/db";
import { payrolls, loans, employees, attendances, leaves } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
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
    const startOfMonth = new Date(year, monthNum - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59);

    // 1. Calculate Attendance Deductions & Hours
    const monthAttendances = await db.select().from(attendances).where(
      and(
        eq(attendances.employeeId, employeeId),
        gte(attendances.clockIn, startOfMonth),
        lte(attendances.clockIn, endOfMonth)
      )
    );

    let totalLateMinutes = 0;
    let totalActualWorkHours = 0;
    const SHIFT_START_HOUR = 8;
    const SHIFT_START_MINUTE = 0;
    const DEDUCTION_PER_MINUTE = 5000; 

    monthAttendances.forEach(att => {
      if (att.clockIn) {
        const checkIn = new Date(att.clockIn);
        const shiftStart = new Date(checkIn);
        shiftStart.setHours(SHIFT_START_HOUR, SHIFT_START_MINUTE, 0, 0);

        if (checkIn > shiftStart) {
          const diffMs = checkIn.getTime() - shiftStart.getTime();
          totalLateMinutes += Math.floor(diffMs / (1000 * 60));
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
        gte(leaves.startDate, startOfMonth),
        lte(leaves.startDate, endOfMonth)
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

       // Track leave dates
       for (let i = 0; i < diffDays; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          approvedLeaveDays.add(d.toISOString().split('T')[0]);
       }

       // Apply deduction for certain types (including annual for simulation/policy)
       if (lv.type === "annual" || lv.type === "important" || lv.type === "unpaid") {
          leaveDeduction += diffDays * LEAVE_DEDUCTION_RATE;
       }
    });

    // 2b. Calculate Alpha (absent without approved leave)
    let alphaDeduction = 0;
    const attendanceDates = new Set<string>();
    monthAttendances.forEach(att => {
      if (att.clockIn) {
        const date = new Date(att.clockIn).toISOString().split('T')[0];
        attendanceDates.add(date);
      }
    });

    // Calculate working days in month (exclude weekends)
    let workingDaysInMonth = 0;
    let alphaDays = 0;
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      // Exclude Saturdays (6) and Sundays (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysInMonth++;
        const dateStr = new Date(d).toISOString().split('T')[0];
        // Check if employee has attendance or approved leave on this day
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
