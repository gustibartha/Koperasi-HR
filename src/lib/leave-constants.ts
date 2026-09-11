// Leave policy constants (shared between server actions and UI)

// Annual leave quota (days) per employee per year
export const ANNUAL_LEAVE_QUOTA = 12;

export const SICK_TYPES = ["sick", "sick_normal", "menstrual"];
export const IMPORTANT_TYPES = ["important", "marriage_self", "birth_wife", "death_immediate"];
// Perjalanan Dinas (official business travel/duty): fully paid, doesn't touch
// the annual leave quota, and excuses attendance (no alpha) — same treatment
// as other approved leave types, just tracked in its own bucket.
export const DINAS_TYPES = ["dinas"];

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Cuti Tahunan",
  sick_normal: "Izin Sakit (Bukan Kecelakaan Kerja)",
  menstrual: "Izin Istirahat Haid",
  marriage_self: "Pernikahan Karyawan",
  birth_wife: "Istri Melahirkan",
  death_immediate: "Keluarga Inti Meninggal",
  dinas: "Perjalanan Dinas",
};
