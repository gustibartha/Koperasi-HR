"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Building2 } from "lucide-react"
import { getCompanies } from "@/app/actions/company"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [companies, setCompanies] = React.useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = React.useState("")
  const [selectedCompany, setSelectedCompany] = React.useState<any>(null)

  React.useEffect(() => {
    async function fetchCompanies() {
      const res = await getCompanies()
      if (res.success && res.data) {
        setCompanies(res.data)
        if (res.data.length > 0) {
          setSelectedCompanyId(res.data[0].id)
          setSelectedCompany(res.data[0])
        }
      }
    }
    fetchCompanies()
  }, [])

  const handleCompanyChange = (id: string) => {
    setSelectedCompanyId(id)
    const found = companies.find(c => c.id === id)
    setSelectedCompany(found)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Simulate login logic
    setTimeout(() => {
      try {
        const users: Record<string, { password: string; role: string; name: string; redirect: string, allowedCompanyId?: string }> = {
          "admin@koperasi.com": { password: "admin123", role: "superadmin", name: "Admin HR", redirect: "/dashboard" },
          "jufri.a60@gmail.com": { password: "admin123", role: "admin", name: "M. Jufri Arfah (Direktur)", redirect: "/dashboard", allowedCompanyId: "59083ab0-cf7a-4482-9304-16708164ef45" },
          "ardiarkanto@gmail.com": { password: "admin123", role: "admin", name: "Ardianto (Direktur)", redirect: "/dashboard", allowedCompanyId: "279bfb86-1b29-4b69-8e7c-5c9ac51a0c7e" },
          "fitrahginanjar@gmail.com": { password: "admin123", role: "admin", name: "Fitrah Ginanjar (Manajer)", redirect: "/dashboard", allowedCompanyId: "22841c61-fa3d-4b79-8922-b50ece65ca70" },
          "user@koperasi.com": { password: "user123", role: "user", name: "Pegawai Demo", redirect: "/attendance" },
        }

        const user = users[email]
        if (user && user.password === password) {
          localStorage.setItem("userRole", user.role)
          localStorage.setItem("userName", user.name)
          // Tenant admins are locked to their own entity; superadmin can switch freely.
          if (user.allowedCompanyId) {
            localStorage.setItem("allowedCompanyId", user.allowedCompanyId)
            localStorage.setItem("selectedCompanyId", user.allowedCompanyId)
          } else {
            localStorage.removeItem("allowedCompanyId")
            localStorage.setItem("selectedCompanyId", selectedCompanyId)
          }
          router.replace(user.redirect)
        } else {
          setError("Email atau Password salah. Silakan coba lagi.")
          setLoading(false)
        }
      } catch (e) {
        console.error("Auth error:", e)
        setError("Terjadi kesalahan sistem. Silakan coba lagi.")
        setLoading(false)
      }
    }, 800)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 animate-in fade-in duration-1000">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 blur-[120px] -z-10 rounded-full"></div>

      <Card className="w-full max-w-xl bg-card border-border rounded-3xl md:rounded-[3rem] p-6 md:p-12 shadow-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <CardHeader className="space-y-8 pb-10">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white px-8 py-4 rounded-[2rem] shadow-2xl shadow-white/5 transition-all hover:scale-105 border border-white/10">
              <img 
                src={selectedCompany?.logo || "/logo-kowika.png"} 
                alt="Company Logo" 
                className="h-12 w-auto object-contain" 
              />
            </div>
          </div>
          <div className="space-y-3">
            <CardTitle className="text-4xl font-bold text-center tracking-tighter font-serif text-foreground italic">
              {selectedCompany?.name || "Admin Portal"}
            </CardTitle>
            <CardDescription className="text-lg text-center text-muted-foreground font-medium">
              Silakan pilih entitas dan login untuk mengelola operasional.
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-10">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                <AlertCircle className="h-5 w-5" />
                <p className="font-bold">{error}</p>
              </div>
            )}
            
            <div className="grid gap-4">
              <Label className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Pilih Entitas Perusahaan</Label>
              <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="h-16 text-lg bg-accent/30 border-border rounded-2xl px-6 font-bold flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <SelectValue placeholder="Pilih PT / Koperasi">
                    {selectedCompany?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-popover shadow-2xl p-2">
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-xl py-4 px-5 focus:bg-primary/10 cursor-pointer font-bold">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nama@koperasi.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold"
              />
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Password</Label>
                <Link href="/forgot-password" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Lupa Password?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-8 pt-10">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 text-xl font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </Button>
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground font-medium">
                Belum punya akun?{" "}
                <Link href="/register" className="text-primary font-bold hover:underline">
                  Daftar di sini
                </Link>
              </p>
              <Link href="/" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2">
                <span>←</span> Kembali ke Beranda
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
