import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { employees } from './src/db/schema';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const wksId = '279bfb86-1b29-4b69-8e7c-5c9ac51a0c7e';
const kowikaId = '22841c61-fa3d-4b79-8922-b50ece65ca70';
const wkiId = '59083ab0-cf7a-4482-9304-16708164ef45';

const wksEmployees = [
  { id: '8225001WKS', companyId: wksId, name: 'Ardianto', email: 'ardiarkanto@gmail.com', position: 'Direktur', joiningYear: 'April 2025', role: 'admin' },
  { id: '7625002WKS', companyId: wksId, name: 'Suparno', email: 'jokosuparno76@gmail.com', position: 'SPV Marketing', joiningYear: 'Mei 2025', role: 'karyawan' },
  { id: '0225003WKS', companyId: wksId, name: 'Salsa Elsi Salfarilla', email: 'salsaelsisalfarilla@gmail.com', position: 'Tax, Finance, and Administration Staff', joiningYear: 'November 2025', role: 'karyawan' }
];

const kowikaEmployees = [
  { id: '8222001KOP', companyId: kowikaId, name: 'FITRAH GINANJAR', email: 'fitrahginanjar@gmail.com', position: 'Manajer Bidang Usaha', joiningYear: '18/07/2022', role: 'admin' },
  { id: '8098003KOP', companyId: kowikaId, name: 'SUPRIYANTO', email: 'supri.kasim0980@gmail.com', position: 'Keuangan', joiningYear: '01/01/1998', role: 'karyawan' },
  { id: '8203004KOP', companyId: kowikaId, name: 'ANDRI EKO MARDANI', email: 'andrimardani69@gmail.com', position: 'SDM', joiningYear: '01/05/2003', role: 'karyawan' },
  { id: '7704006KOP', companyId: kowikaId, name: 'RONY SUSANTO', email: 'ronnysusanto409@gmail.com', position: 'Marketing', joiningYear: '01/08/2004', role: 'karyawan' },
  { id: '8922008KOP', companyId: kowikaId, name: 'SUHARI', email: 'acanksuhari@gmail.com', position: 'Staff toko', joiningYear: '01/08/2022', role: 'karyawan' },
  { id: '8202010KOP', companyId: kowikaId, name: 'NETTI HUTAHAEAN', email: 'nettihuta@gmail.com', position: 'Asisten Apoteker', joiningYear: '25/04/2002', role: 'karyawan' },
  { id: '8202011KOP', companyId: kowikaId, name: 'DWI ASTUTI', email: 'dwia1282@gmail.com', position: 'Asisten Apoteker', joiningYear: '01/05/2002', role: 'karyawan' },
  { id: '9923012KOP', companyId: kowikaId, name: 'AIS CLARA LARASAE', email: 'aisclara526@gmail.com', position: 'Staff admin', joiningYear: '16/05/2023', role: 'karyawan' },
  { id: '8725015KOP', companyId: kowikaId, name: 'SIDIK MAULIDIN', email: 'maulidinsiddiq@gmail.com', position: 'Marketing', joiningYear: '02/06/2025', role: 'karyawan' }
];

const wkiEmployees = [
  { id: '6525255WKI', companyId: wkiId, name: 'PADMONO', email: 'padmono@koperasi.com', position: 'Komisaris', joiningYear: '24 Maret 2025', role: 'karyawan' },
  { id: '6025254WKI', companyId: wkiId, name: 'M.JUFRI ARFAH', email: 'jufri.a60@gmail.com', position: 'Direktur', joiningYear: '24 Maret 2025', role: 'admin' },
  { id: '7422018WKI', companyId: wkiId, name: 'SUHERMAN', email: 'suherman_mkr@yahoo.com', position: 'Staff Marketing', joiningYear: '01 Juli 2022', role: 'karyawan' },
  { id: '7322020WKI', companyId: wkiId, name: 'EDDY DJAELANI', email: 'eddyjay0550@gmail.com', position: 'Staff Marketing', joiningYear: '01 Juli 2022', role: 'karyawan' },
  { id: '9822198WKI', companyId: wkiId, name: 'BOBBY ANUGRAH SIGIRO', email: 'bobbyasigiro99@gmail.com', position: 'Staff Marketing', joiningYear: '01 April 2022', role: 'karyawan' },
  { id: '9825257WKI1', companyId: wkiId, name: 'RISKA RAMADHANTI', email: 'riskaramadhanti001@gmail.com', position: 'Staff Keuangan Dan Pajak', joiningYear: '14 Mei 2025', role: 'karyawan' },
  { id: '9926263WKI', companyId: wkiId, name: 'YESI BUDI INDRIANI', email: 'ybindriani@gmail.com', position: 'Staff SDM Dan Umum', joiningYear: '29 April 2026', role: 'karyawan' },
  { id: '7422023WKI', companyId: wkiId, name: 'UJANG NURYADIN', email: 'nuryadinujang794@gmail.com', position: 'Pengemudi', joiningYear: '01 July 2022', role: 'karyawan' }
];

const allEmployees = [...wksEmployees, ...kowikaEmployees, ...wkiEmployees].map(emp => ({
  ...emp,
  createdAt: new Date(),
  updatedAt: new Date()
}));

async function seed() {
  try {
    for (const emp of allEmployees) {
      // Insert with ON CONFLICT DO NOTHING just in case script is run multiple times
      await db.insert(employees)
        .values(emp as any)
        .onConflictDoNothing({ target: employees.id });
    }
    console.log('Seeding employees selesai!');
  } catch (e) {
    console.error('Gagal seeding employees:', e);
  } finally {
    process.exit(0);
  }
}

seed();
