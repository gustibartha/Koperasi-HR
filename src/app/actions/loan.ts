"use server";

import { db } from "@/db";
import { loans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function createLoan(employeeId: string, totalAmount: number, monthlyInstallment: number) {
  try {
    await db.insert(loans).values({
      id: randomUUID(),
      employeeId,
      totalAmount,
      monthlyInstallment,
      remainingAmount: totalAmount,
      status: "belum_lunas",
      createdAt: new Date(),
    });
    return { success: true, message: "Pinjaman berhasil ditambahkan" };
  } catch (error) {
    return { success: false, message: "Gagal menambahkan pinjaman", error };
  }
}

export async function updateLoanStatus(loanId: string, status: "lunas" | "belum_lunas") {
  try {
    await db.update(loans)
      .set({ status })
      .where(eq(loans.id, loanId));
    return { success: true, message: `Status pinjaman diperbarui menjadi ${status}` };
  } catch (error) {
    return { success: false, message: "Gagal memperbarui status pinjaman", error };
  }
}

export async function deductLoan(loanId: string, deductionAmount: number) {
    // Dipanggil saat penggajian bulanan
    try {
        const loan = await db.select().from(loans).where(eq(loans.id, loanId)).get();
        if(!loan) throw new Error("Loan not found");

        const newRemaining = loan.remainingAmount - deductionAmount;
        await db.update(loans).set({
            remainingAmount: newRemaining > 0 ? newRemaining : 0,
            status: newRemaining <= 0 ? "lunas" : "belum_lunas"
        }).where(eq(loans.id, loanId));

        return { success: true, message: "Cicilan pinjaman berhasil dipotong" };
    } catch(error) {
        return { success: false, message: "Gagal memotong cicilan pinjaman", error };
    }
}

export async function getLoansByEmployee(employeeId: string) {
  try {
    const data = await db.select().from(loans).where(eq(loans.employeeId, employeeId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data pinjaman", error };
  }
}
