"use server";

import { db } from "@/db";
import { employees, attendances, leaves, performances } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export async function getDashboardStats(companyId?: string) {
  try {
    if (!companyId) {
      return {
        success: true,
        data: {
          totalEmployees: 0,
          presentToday: 0,
          pendingLeaves: 0,
          avgKpi: 0,
          attendanceRate: 0,
          weeklyAttendance: [] as { label: string; count: number }[],
          recentLeaves: [] as any[],
        },
      };
    }

    // Start of today (local server time)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [empRows, attRows, leaveRows, perfRows] = await Promise.all([
      db.select({ id: employees.id }).from(employees).where(eq(employees.companyId, companyId)),
      db
        .select({ id: attendances.id, employeeId: attendances.employeeId, clockIn: attendances.clockIn })
        .from(attendances)
        .where(eq(attendances.companyId, companyId)),
      db
        .select({
          id: leaves.id,
          employeeName: employees.name,
          type: leaves.type,
          status: leaves.status,
          startDate: leaves.startDate,
          createdAt: leaves.createdAt,
        })
        .from(leaves)
        .leftJoin(employees, eq(leaves.employeeId, employees.id))
        .where(eq(leaves.companyId, companyId))
        .orderBy(desc(leaves.createdAt)),
      db.select({ kpiScore: performances.kpiScore }).from(performances).where(eq(performances.companyId, companyId)),
    ]);

    const totalEmployees = empRows.length;

    // Present today: unique employees with a clockIn today
    const presentSet = new Set<string>();
    for (const a of attRows) {
      if (a.clockIn && new Date(a.clockIn) >= startOfToday) {
        presentSet.add(a.employeeId);
      }
    }
    const presentToday = presentSet.size;
    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 1000) / 10 : 0;

    const pendingLeaves = leaveRows.filter((l) => l.status === "menunggu").length;

    const avgKpi =
      perfRows.length > 0
        ? Math.round((perfRows.reduce((sum, p) => sum + (p.kpiScore || 0), 0) / perfRows.length) * 10) / 10
        : 0;

    // Weekly attendance for the last 7 days (count of attendance records per day)
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const weeklyAttendance: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(startOfToday);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = attRows.filter(
        (a) => a.clockIn && new Date(a.clockIn) >= dayStart && new Date(a.clockIn) < dayEnd
      ).length;
      weeklyAttendance.push({ label: dayNames[dayStart.getDay()], count });
    }

    const recentLeaves = leaveRows.slice(0, 4);

    return {
      success: true,
      data: {
        totalEmployees,
        presentToday,
        pendingLeaves,
        avgKpi,
        attendanceRate,
        weeklyAttendance,
        recentLeaves,
      },
    };
  } catch (error) {
    return { success: false, message: "Gagal mengambil statistik dashboard", error };
  }
}
