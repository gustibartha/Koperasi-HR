import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 animate-in fade-in duration-1000">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

      <Card className="w-full max-w-4xl bg-card border-border rounded-[3rem] p-6 md:p-12 shadow-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <CardHeader className="space-y-4 pb-10">
          <CardTitle className="text-4xl font-bold tracking-tighter font-serif text-foreground">
            Kebijakan Privasi (Privacy Policy)
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground font-medium">
            Berlaku efektif sejak: Mei 2026
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 text-foreground/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">1. Pengumpulan Data</h2>
            <p>
              Koperasi Wira Karyawan (Kowika) dan PT Wira Karya Sinergi mengumpulkan data pribadi karyawan seperti nama, email, lokasi GPS saat absensi, foto biometrik (jika digunakan), dan data terkait operasional pekerjaan (penggajian, cuti, SPPD).
            </p>
          </section>
          
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">2. Penggunaan Data</h2>
            <p>
              Data yang dikumpulkan akan digunakan secara eksklusif untuk keperluan internal perusahaan, termasuk namun tidak terbatas pada:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Pencatatan kehadiran dan perhitungan jam kerja.</li>
              <li>Proses penggajian (payroll) dan manajemen tunjangan.</li>
              <li>Administrasi Koperasi (pinjaman dan simpanan).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">3. Perlindungan & Keamanan</h2>
            <p>
              Kami berkomitmen untuk melindungi data pribadi Anda menggunakan standar keamanan enkripsi terkini. Data tidak akan diperjualbelikan atau dibagikan kepada pihak ketiga di luar kepentingan operasional legal perusahaan.
            </p>
          </section>
          
          <div className="pt-10 border-t border-border mt-10">
            <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-8 text-sm font-bold text-foreground transition-colors hover:bg-accent/80">
              ← Kembali ke Beranda
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
