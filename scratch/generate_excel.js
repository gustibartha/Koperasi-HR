const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Employee Template
const empData = [
    ["Nama", "Nomor WA", "Email", "Pendidikan", "Jabatan", "Bagian", "Tahun Masuk"],
    ["Ahmad Sudirman", "081234567890", "ahmad@koperasi.com", "S1 Psikologi", "HR Manager", "Operasional", "2020"],
    ["Siti Aminah", "081298765432", "siti@koperasi.com", "S1 Akuntansi", "Staff Keuangan", "Keuangan", "2022"]
];
const empWS = XLSX.utils.aoa_to_sheet(empData);
const empWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(empWB, empWS, "Employees");
XLSX.writeFile(empWB, path.join(publicDir, 'employee_template.xlsx'));

// 2. Payroll Template
const payrollData = [
    [
        "Nama", "No Rekening", "Gaji Pokok", "Uang Makan", "Tunj. Posisi", 
        "Tunj. Kompetensi", "Tunj. Pulsa", "Premi", "Potongan Alpa", 
        "Jamsostek", "BPJS Kesehatan", "Simpan Pinjam", "Potongan Toko", 
        "Lain-lain", "Uang Makan Lembur", "Lemburan"
    ],
    [
        "Ahmad Sudirman", "BCA-12345678", 5625000, 500000, 1000000, 
        500000, 100000, 200000, 0, 150000, 100000, 500000, 200000, 0, 50000, 250000
    ]
];
const payWS = XLSX.utils.aoa_to_sheet(payrollData);
const payWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(payWB, payWS, "Payroll");
XLSX.writeFile(payWB, path.join(publicDir, 'payroll_template.xlsx'));

console.log("Excel templates generated successfully in /public directory!");
