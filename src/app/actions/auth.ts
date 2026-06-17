"use server";

import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// --- Password hashing helpers (salt:hash, scrypt) ---
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const testBuf = scryptSync(password, salt, 64);
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
}

type AuthEmployee = {
  id: string;
  name: string;
  email: string;
  role: string; // "admin" | "karyawan"
  companyId: string | null;
  position: string;
};

function toAuthEmployee(emp: typeof employees.$inferSelect): AuthEmployee {
  return {
    id: emp.id,
    name: emp.name,
    email: emp.email,
    role: emp.role,
    companyId: emp.companyId,
    position: emp.position,
  };
}

/**
 * Register an employee account.
 * - If an employee with this email already exists (e.g. seeded), link the
 *   account by setting its password (no duplicate record is created).
 * - Otherwise create a new employee in the chosen company as "karyawan".
 * New accounts are active immediately.
 */
export async function registerEmployee(data: {
  name: string;
  email: string;
  password: string;
  companyId: string;
}) {
  try {
    const email = data.email.trim().toLowerCase();
    if (!email || !data.password || !data.companyId) {
      return { success: false, message: "Data pendaftaran belum lengkap." };
    }

    const existing = await db.select().from(employees).where(eq(employees.email, email)).limit(1);

    if (existing.length > 0) {
      const emp = existing[0];
      if (emp.password) {
        return { success: false, message: "Email sudah memiliki akun. Silakan login." };
      }
      // Link account to the existing (seeded) employee record.
      await db.update(employees)
        .set({ password: hashPassword(data.password), updatedAt: new Date() })
        .where(eq(employees.id, emp.id));
      return { success: true, employee: toAuthEmployee({ ...emp, password: "set" }) };
    }

    // Create a brand-new employee record.
    const id = "EMP" + Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date();
    await db.insert(employees).values({
      id,
      companyId: data.companyId,
      name: data.name.trim(),
      email,
      password: hashPassword(data.password),
      role: "karyawan",
      position: "Karyawan",
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      employee: {
        id, name: data.name.trim(), email, role: "karyawan",
        companyId: data.companyId, position: "Karyawan",
      } as AuthEmployee,
    };
  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return { success: false, message: "Gagal mendaftar. Coba lagi." };
  }
}

/**
 * Log in an employee by email + password against the database.
 */
export async function loginEmployee(email: string, password: string) {
  try {
    const normalized = email.trim().toLowerCase();
    const rows = await db.select().from(employees).where(eq(employees.email, normalized)).limit(1);
    if (rows.length === 0) {
      return { success: false, message: "Email atau Password salah." };
    }
    const emp = rows[0];
    if (!emp.password) {
      return { success: false, message: "Akun belum terdaftar. Silakan daftar dulu." };
    }
    if (!verifyPassword(password, emp.password)) {
      return { success: false, message: "Email atau Password salah." };
    }
    return { success: true, employee: toAuthEmployee(emp) };
  } catch (error) {
    console.error("LOGIN_ERROR:", error);
    return { success: false, message: "Terjadi kesalahan sistem." };
  }
}
