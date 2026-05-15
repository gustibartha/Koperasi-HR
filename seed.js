const Database = require('better-sqlite3');
const { randomUUID } = require('crypto');

const db = new Database('sqlite.db');

const adminId = randomUUID();

// Hapus data lama jika perlu (opsional)
db.prepare('DELETE FROM employees').run();

// Masukkan admin employee
db.prepare(`
  INSERT INTO employees (id, name, email, role, position, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  adminId,
  'Admin Koperasi',
  'admin@koperasi.com',
  'admin',
  'Pengurus',
  Date.now(),
  Date.now()
);

console.log('Seed berhasil: Admin Koperasi (admin@koperasi.com) telah dibuat sebagai pegawai.');
console.log('Catatan: Akun login (password) belum diset, Anda bisa membuat halaman register atau setup Better Auth password di UI.');
