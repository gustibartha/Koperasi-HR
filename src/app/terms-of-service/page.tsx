import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 animate-in fade-in duration-1000">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

      <Card className="w-full max-w-4xl bg-card border-border rounded-[3rem] p-6 md:p-12 shadow-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <CardHeader className="space-y-4 pb-10">
          <CardTitle className="text-4xl font-bold tracking-tighter font-serif text-foreground">
            Syarat dan Ketentuan (Terms of Service)
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground font-medium">
            Berlaku efektif sejak: Mei 2026
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 text-foreground/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">1. Ketentuan Penggunaan Sistem</h2>
            <p>
              Dengan mengakses dan menggunakan sistem Koperasi HR Wira Karyawan, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Sistem ini hanya diperuntukkan bagi karyawan internal PT Wira Karya Sinergi, PT Wira Karya Indonesia, dan Koperasi Wira Karyawan.
            </p>
          </section>
          
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">2. Tanggung Jawab Pengguna</h2>
            <p>
              Setiap karyawan bertanggung jawab atas keamanan akun (email dan password) masing-masing. Karyawan dilarang:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Membagikan akses akun kepada pihak yang tidak berwenang.</li>
              <li>Memanipulasi sistem absensi (contoh: memalsukan lokasi GPS).</li>
              <li>Mengakses data sensitif karyawan lain tanpa otorisasi (kecuali admin/manajer).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">3. Layanan Koperasi & SPPD</h2>
            <p>
              Pengajuan pinjaman, cuti, dan SPPD melalui sistem ini tunduk pada kebijakan persetujuan berjenjang. Sistem bertindak sebagai alat pencatatan, sedangkan keputusan akhir berada di tangan manajemen terkait.
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
