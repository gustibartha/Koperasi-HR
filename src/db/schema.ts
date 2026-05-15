import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

// Table Perusahaan (Multi-Tenant)
export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  address: text("address"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

// Table Pegawai
export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id), // Tenant ID
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role", { enum: ["admin", "karyawan"] }).notNull().default("karyawan"),
  position: text("position").notNull(),
  department: text("department"),
  education: text("education"),
  joiningYear: text("joining_year"),
  biometrikId: text("biometrik_id"), // Untuk validasi sidik jari/wajah
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});

// Table Kehadiran
export const attendances = pgTable("attendances", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  clockIn: timestamp("clock_in", { mode: "date" }),
  clockOut: timestamp("clock_out", { mode: "date" }),
  locationGps: text("location_gps"),
  biometricValid: boolean("biometric_valid"), // SQLite boolean is 0/1
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

// Table Cuti
export const leaves = pgTable("leaves", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  reason: text("reason").notNull(),
  type: text("type").default("annual"), // annual, sick, important, unpaid
  status: text("status", { enum: ["menunggu", "disetujui", "ditolak"] }).default("menunggu"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

// Table Pinjaman
export const loans = pgTable("loans", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  totalAmount: real("total_amount").notNull(),
  monthlyInstallment: real("monthly_installment").notNull(),
  remainingAmount: real("remaining_amount").notNull(),
  status: text("status", { enum: ["lunas", "belum_lunas"] }).default("belum_lunas"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

// Table Penggajian
export const payrolls = pgTable("payrolls", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  month: text("month").notNull(), // Format YYYY-MM
  basicSalary: real("basic_salary").notNull(),
  mealAllowance: real("meal_allowance").default(0),
  positionAllowance: real("position_allowance").default(0),
  competencyAllowance: real("competency_allowance").default(0),
  phoneAllowance: real("phone_allowance").default(0),
  premi: real("premi").default(0),
  overtimeAmount: real("overtime_amount").default(0),
  overtimeMeal: real("overtime_meal").default(0),
  loanDeduction: real("loan_deduction").default(0),
  shopDeduction: real("shop_deduction").default(0),
  jamsostek: real("jamsostek").default(0),
  bpjsHealth: real("bpjs_health").default(0),
  lateDeduction: real("late_deduction").default(0),
  leaveDeduction: real("leave_deduction").default(0),
  otherDeduction: real("other_deduction").default(0),
  actualWorkHours: real("actual_work_hours").default(0),
  expectedWorkHours: real("expected_work_hours").default(0),
  netSalary: real("net_salary").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

// Table Kinerja
export const performances = pgTable("performances", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  month: text("month").notNull(), // Format YYYY-MM
  kpiScore: integer("kpi_score").notNull(),
  evaluationNote: text("evaluation_note"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

// Table SPPD (Surat Perintah Perjalanan Dinas)
export const sppds = pgTable("sppds", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id),
  employeeId: text("employee_id").notNull().references(() => employees.id),
  origin: text("origin").notNull().default("Soekarno-Hatta (Tangerang)"),
  destination: text("destination").notNull(),
  departureDate: timestamp("departure_date", { mode: "date" }).notNull(),
  returnDate: timestamp("return_date", { mode: "date" }).notNull(),
  purpose: text("purpose").notNull(),
  status: text("status", { enum: ["menunggu", "disetujui", "ditolak"] }).default("menunggu"),
  dailyAllowance: real("daily_allowance").default(0),
  transportCost: real("transport_cost").default(0),
  hotelCost: real("hotel_cost").default(0),
  otherCost: real("other_cost").default(0),
  totalCost: real("total_cost").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});

// Better Auth Tables (User, Session, Account, Verification)
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at", { mode: "date" }).notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
    employeeId: text("employee_id").references(() => employees.id), // Link to employees
    companyId: text("company_id").references(() => companies.id), // User's home company
    role: text("role").notNull().default("karyawan")
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at", { mode: "date" }).notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: "date" }),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at", { mode: "date" }).notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
	createdAt: timestamp("created_at", { mode: "date" }).notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).notNull()
});
