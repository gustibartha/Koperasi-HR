"use server";

import { db } from "@/db";
import { performances, employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function addPerformanceEvaluation(employeeId: string, month: string, kpiScore: number, evaluationNote: string, companyId?: string) {
  try {
    await db.insert(performances).values({
      id: randomUUID(),
      employeeId,
      companyId,
      month,
      kpiScore,
      evaluationNote,
      createdAt: new Date(),
    });
    return { success: true, message: "Evaluasi kinerja berhasil ditambahkan" };
  } catch (error) {
    return { success: false, message: "Gagal menambahkan evaluasi kinerja", error };
  }
}

export async function getPerformancesByEmployee(employeeId: string) {
  try {
    const data = await db.select().from(performances).where(eq(performances.employeeId, employeeId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data evaluasi kinerja", error };
  }
}
export async function getAllPerformances(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: [] };
    const data = await db.select({
      id: performances.id,
      employeeName: employees.name,
      month: performances.month,
      kpiScore: performances.kpiScore,
      evaluationNote: performances.evaluationNote,
    })
    .from(performances)
    .leftJoin(employees, eq(performances.employeeId, employees.id))
    .where(eq(performances.companyId, companyId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil semua data evaluasi kinerja", error };
  }
}
