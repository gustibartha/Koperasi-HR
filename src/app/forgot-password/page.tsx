"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call for password reset
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1500)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 animate-in fade-in duration-1000">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 blur-[120px] -z-10 rounded-full"></div>

      <Card className="w-full max-w-xl bg-card border-border rounded-[3rem] p-6 md:p-12 shadow-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>
        
        <CardHeader className="space-y-4 pb-10 text-center">
          <CardTitle className="text-4xl font-bold tracking-tighter font-serif text-foreground italic">
            Lupa Password
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground font-medium">
            Masukkan email Anda dan kami akan mengirimkan instruksi untuk mereset password.
          </CardDescription>
        </CardHeader>
        
        {!success ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-6">
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
            </CardContent>
            
            <CardFooter className="flex flex-col gap-6 pt-10">
              <Button 
                type="submit" 
                disabled={loading || !email}
                className="w-full h-16 text-xl font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                {loading ? "Memproses..." : "Kirim Link Reset"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2">
                  <span>←</span> Kembali ke Halaman Login
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-6 text-center animate-in zoom-in duration-500">
            <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Cek Email Anda</h3>
              <p className="text-muted-foreground">Kami telah mengirimkan tautan reset password ke <span className="font-bold text-foreground">{email}</span></p>
            </div>
            <Link href="/login" className="mt-8 w-full">
              <Button variant="outline" className="w-full h-16 text-xl font-bold border-border rounded-2xl hover:bg-accent transition-all">
                Kembali ke Login
              </Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
