import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
      {/* Background Grid Pattern - Using subtle color from design system */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>

      <header className="relative z-10 px-6 lg:px-12 h-20 flex items-center justify-between border-b border-border bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 shadow-lg shadow-black/20">
            <img src="/logo-wki.png" alt="WKI Logo" className="h-8 w-auto object-contain rounded" />
            <div className="w-px h-6 bg-border mx-1"></div>
            <img src="/logo-wks.jpg" alt="WKS Logo" className="h-8 w-auto object-contain rounded" />
            <div className="w-px h-6 bg-border mx-1"></div>
            <img src="/logo-kowika.png" alt="Kowika Logo" className="h-8 w-auto object-contain rounded" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-xl tracking-tight">Wira Karyawan</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-bold">Sistem Koperasi Digital</span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-muted-foreground">
          <Link className="hover:text-primary transition-colors" href="#">Fitur</Link>
          <Link className="hover:text-primary transition-colors" href="#">Cara Kerja</Link>
          <Link className="hover:text-primary transition-colors" href="#">Peran</Link>
          <Link className="hover:text-primary transition-colors" href="#">Teknologi</Link>
        </nav>

        <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-bold text-foreground transition-colors hover:bg-accent">
          Masuk
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center">
        <section className="w-full py-16 md:py-24 lg:py-32">
          <div className="container px-6 md:px-12 mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Left Content */}
              <div className="flex flex-col space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="flex items-center gap-4">
                  <div className="h-[2px] w-10 bg-primary"></div>
                  <span className="text-xs font-bold uppercase tracking-[0.4em] text-primary">Sistem HR & Koperasi Terintegrasi</span>
                </div>
                
                <h1 className="text-6xl md:text-8xl font-serif leading-[1.05] tracking-tighter">
                  Kelola <span className="text-primary italic">SDM & Koperasi</span> dalam <span className="text-primary italic">Satu Platform</span>
                </h1>
                
                <p className="max-w-[580px] text-muted-foreground text-xl leading-relaxed font-medium">
                  Absensi biometrik, payroll otomatis, pinjaman koperasi, dan penilaian kinerja — semua terpadu, efisien, dan siap pakai untuk tim Anda.
                </p>
                
                <div className="flex flex-wrap gap-5 pt-6">
                  <Link href="/dashboard" className="inline-flex h-14 items-center justify-center rounded-xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02]">
                    Mulai Sekarang
                  </Link>
                  <Button variant="outline" size="lg" nativeButton={false} className="border-border bg-transparent hover:bg-accent text-foreground px-10 h-14 text-lg font-bold rounded-xl" render={<Link href="#" />}>
                    Lihat Fitur →
                  </Button>
                </div>
              </div>

              {/* Right Visual (Mockup Card) */}
              <div className="relative hidden lg:flex justify-center animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="w-full max-w-[460px] rounded-3xl bg-card border border-border shadow-2xl p-10 relative overflow-hidden group">
                  {/* Subtle glow effect using primary color */}
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all duration-1000"></div>
                  
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center font-bold text-xl text-secondary-foreground shadow-lg">AS</div>
                      <div>
                        <h4 className="font-bold text-foreground text-lg">Andi Saputra</h4>
                        <p className="text-sm text-muted-foreground font-medium tracking-wide">Staff Operasional</p>
                      </div>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold flex items-center gap-2 tracking-widest uppercase">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      HADIR
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-muted-foreground font-medium tracking-wide">Jam Masuk</span>
                      <span className="font-mono font-bold text-foreground bg-accent px-2 py-0.5 rounded">08:02</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-muted-foreground font-medium tracking-wide">Lokasi GPS</span>
                      <span className="text-emerald-500 flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                        <Check className="h-4 w-4 stroke-[3]" /> Terverifikasi
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-muted-foreground font-medium tracking-wide">Biometrik</span>
                      <span className="text-emerald-500 flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                        <Check className="h-4 w-4 stroke-[3]" /> Valid
                      </span>
                    </div>
                    
                    <div className="h-px bg-border my-4"></div>
                    
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-muted-foreground font-medium tracking-wide">Sisa Cuti</span>
                      <span className="text-primary font-bold text-lg tracking-tight">8 Hari</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-muted-foreground font-medium tracking-wide">Cicilan Koperasi</span>
                      <span className="text-primary font-bold text-lg tracking-tight">Rp 500.000</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-10 px-6 lg:px-12 border-t border-border text-muted-foreground text-[11px] font-bold uppercase tracking-[0.2em] flex flex-col md:flex-row justify-between items-center gap-6 bg-background/80 backdrop-blur-sm">
        <p>© 2026 Koperasi Wira Karyawan. All rights reserved.</p>
        <div className="flex gap-10">
          <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
