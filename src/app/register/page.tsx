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
import { AlertCircle, Building2, User } from "lucide-react"
import { getCompanies } from "@/app/actions/company"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok.")
      return
    }

    setLoading(true)

    // Simulate registration logic
    setTimeout(() => {
      try {
        // Here we would typically send data to the backend
        // For now, we simulate a successful registration and auto-login
        localStorage.setItem("userRole", "user")
        localStorage.setItem("userName", name)
        localStorage.setItem("selectedCompanyId", selectedCompanyId)
        
        // Redirect to dashboard/attendance
        router.replace("/attendance")
      } catch (e) {
        console.error("Auth error:", e)
        setError("Terjadi kesalahan sistem. Silakan coba lagi.")
        setLoading(false)
      }
    }, 1200)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 animate-in fade-in duration-1000">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 blur-[120px] -z-10 rounded-full"></div>

      <Card className="w-full max-w-xl bg-card border-border rounded-[3rem] p-12 shadow-3xl overflow-hidden relative">
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
              Pendaftaran Akun
            </CardTitle>
            <CardDescription className="text-lg text-center text-muted-foreground font-medium">
              Silakan lengkapi data diri Anda untuk mendapatkan akses ke sistem.
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleRegister}>
          <CardContent className="grid gap-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                <AlertCircle className="h-5 w-5" />
                <p className="font-bold">{error}</p>
              </div>
            )}

            <div className="grid gap-3">
              <Label className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Pilih Entitas Perusahaan</Label>
              <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                <SelectTrigger className="h-14 text-lg bg-accent/30 border-border rounded-2xl px-6 font-bold flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <SelectValue placeholder="Pilih PT / Koperasi">
                    {selectedCompany?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-popover shadow-2xl p-2">
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-xl py-4 px-5 focus:bg-primary/10 cursor-pointer font-bold text-lg">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Nama Lengkap</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nama@koperasi.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.2em] text-primary ml-1">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-[0.2em] text-primary ml-1">Konfirmasi Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold"
                />
              </div>
            </div>

          </CardContent>
          
          <CardFooter className="flex flex-col gap-6 pt-8">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 text-xl font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
              {loading ? "Memproses..." : "Daftar Sekarang"}
            </Button>
            
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground font-medium">
                Sudah punya akun?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">
                  Login di sini
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
