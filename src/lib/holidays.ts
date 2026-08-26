// Hari libur nasional Indonesia (tanggal merah).
// Format: "YYYY-MM-DD": "Nama Libur".
//
// Tanggal FIXED (1 Jan, 1 Mei, 1 Jun, 17 Agu, 25 Des) sudah pasti.
// Tanggal libur keagamaan yang BERGESER tiap tahun mengikuti SKB 3 Menteri —
// silakan sesuaikan bila pemerintah menetapkan tanggal resmi yang berbeda.
// Cuti bersama juga bisa ditambahkan di sini kalau ingin dihitung libur.
export const HOLIDAYS: Record<string, string> = {
  // ===== 2026 =====
  "2026-01-01": "Tahun Baru Masehi",
  "2026-02-17": "Tahun Baru Imlek 2577",
  "2026-03-19": "Hari Raya Nyepi",
  "2026-03-20": "Idul Fitri 1447 H",
  "2026-03-21": "Idul Fitri 1447 H",
  "2026-04-03": "Wafat Isa Almasih",
  "2026-05-01": "Hari Buruh Internasional",
  "2026-05-14": "Kenaikan Isa Almasih",
  "2026-05-27": "Idul Adha 1447 H",
  "2026-05-31": "Hari Raya Waisak",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-06-16": "Tahun Baru Islam 1448 H",
  "2026-08-17": "Hari Kemerdekaan RI",
  "2026-08-25": "Maulid Nabi Muhammad SAW",
  "2026-12-25": "Hari Raya Natal",

  // ===== 2027 (tanggal fixed; libur keagamaan silakan lengkapi) =====
  "2027-01-01": "Tahun Baru Masehi",
  "2027-05-01": "Hari Buruh Internasional",
  "2027-06-01": "Hari Lahir Pancasila",
  "2027-08-17": "Hari Kemerdekaan RI",
  "2027-12-25": "Hari Raya Natal",
}

export function isHoliday(dateStr: string): boolean {
  return Object.prototype.hasOwnProperty.call(HOLIDAYS, dateStr)
}

export function holidayName(dateStr: string): string | undefined {
  return HOLIDAYS[dateStr]
}
