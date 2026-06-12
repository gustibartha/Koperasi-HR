"use server";

import { db } from "@/db";
import { employees } from "@/db/schema";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

export async function getEmployees(companyId?: string) {
  try {
    if (!companyId) return { success: true, data: [] };
    const data = await db.select().from(employees).where(eq(employees.companyId, companyId));
    return { success: true, data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data pegawai", error };
  }
}

export async function addEmployee(data: {
  name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  education?: string;
  joiningYear?: string;
  companyId: string;
}) {
  try {
    const id = "EMP" + Math.floor(1000 + Math.random() * 9000).toString();
    await db.insert(employees).values({
      id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.position,
      department: data.department,
      education: data.education,
      joiningYear: data.joiningYear,
      companyId: data.companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true, message: "Pegawai berhasil ditambahkan" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal menambahkan pegawai. Mungkin email sudah terdaftar." };
  }
}

export async function updateEmployee(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  education?: string;
  joiningYear?: string;
}) {
  try {
    await db.update(employees)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id));
    return { success: true, message: "Data pegawai berhasil diperbarui" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal memperbarui data pegawai. Mungkin email sudah terdaftar." };
  }
}

export async function deleteEmployee(id: string) {
  try {
    await db.delete(employees).where(eq(employees.id, id));
    return { success: true, message: "Pegawai berhasil dihapus" };
  } catch (error) {
    return { success: false, message: "Gagal menghapus pegawai" };
  }
}
