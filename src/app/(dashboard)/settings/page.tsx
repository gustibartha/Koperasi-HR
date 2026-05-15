"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Settings as SettingsIcon, 
  Building2, 
  Clock, 
  Bell, 
  Shield, 
  Database, 
  Save,
  RotateCcw,
  Globe,
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  const [isSaving, setIsSaving] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }, 1500)
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">System Settings</h1>
          <p className="text-muted-foreground text-xl font-medium">Configure Kowika HR platform parameters and organizational profile.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-14 text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
        >
          {isSaving ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Save className="mr-3 h-6 w-6" />}
          {success ? "Saved Successfully" : "Save All Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-accent/10 border border-border p-1 rounded-2xl h-16 w-full md:w-auto overflow-x-auto no-scrollbar">
          <TabsTrigger value="general" className="rounded-xl px-8 h-full font-bold text-sm uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-lg">
            <Building2 className="mr-2 h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="workflow" className="rounded-xl px-8 h-full font-bold text-sm uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-lg">
            <Clock className="mr-2 h-4 w-4" /> Work Hours
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl px-8 h-full font-bold text-sm uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-lg">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 h-full font-bold text-sm uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-lg">
            <Shield className="mr-2 h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="database" className="rounded-xl px-8 h-full font-bold text-sm uppercase tracking-widest data-[state=active]:bg-card data-[state=active]:shadow-lg">
            <Database className="mr-2 h-4 w-4" /> System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-8 w-full">
          <div className="grid gap-10 lg:grid-cols-2 w-full">
            <Card className="bg-card border-border shadow-xl rounded-[2.5rem] p-8 border hover:border-primary/20 transition-all">
              <CardHeader>
                <CardTitle className="text-2xl font-bold font-serif flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Building2 /></div>
                   Organization Profile
                </CardTitle>
                <CardDescription className="text-lg">Informasi dasar identitas koperasi Anda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Nama Organisasi</Label>
                  <Input defaultValue="Koperasi Wira Karyawan (Kowika)" className="h-14 bg-accent/10 border-border rounded-xl font-bold" />
                </div>
                <div className="grid gap-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Email Resmi</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input defaultValue="admin@kowika.co.id" className="pl-12 h-14 bg-accent/10 border-border rounded-xl font-bold" />
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Telepon Kantor</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input defaultValue="+62 21 8899 0011" className="pl-12 h-14 bg-accent/10 border-border rounded-xl font-bold" />
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Alamat Lengkap</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                    <textarea 
                      className="w-full min-h-[100px] pl-12 pt-4 bg-accent/10 border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                      defaultValue="Jl. Raya Industri Jababeka No. 12, Cikarang, Bekasi, Jawa Barat"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xl rounded-[2.5rem] p-8 border hover:border-primary/20 transition-all">
              <CardHeader>
                <CardTitle className="text-2xl font-bold font-serif flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Globe /></div>
                   Regional & Localization
                </CardTitle>
                <CardDescription className="text-lg">Pengaturan waktu, bahasa, dan mata uang.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                 <div className="flex items-center justify-between p-6 bg-accent/10 rounded-2xl">
                    <div>
                       <p className="font-bold text-lg">Waktu & Zona</p>
                       <p className="text-muted-foreground">Asia/Jakarta (GMT+7)</p>
                    </div>
                    <Badge className="bg-primary font-bold">WIB</Badge>
                 </div>
                 <div className="flex items-center justify-between p-6 bg-accent/10 rounded-2xl">
                    <div>
                       <p className="font-bold text-lg">Format Mata Uang</p>
                       <p className="text-muted-foreground">Indonesian Rupiah (IDR)</p>
                    </div>
                    <Badge variant="outline" className="font-bold border-primary text-primary">Rp</Badge>
                 </div>
                 <div className="flex items-center justify-between p-6 bg-accent/10 rounded-2xl">
                    <div>
                       <p className="font-bold text-lg">Bahasa Sistem Default</p>
                       <p className="text-muted-foreground">Bahasa Indonesia</p>
                    </div>
                    <Button variant="ghost" className="font-bold text-primary">Ubah</Button>
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-8 w-full">
           <Card className="bg-card border-border shadow-xl rounded-[2.5rem] p-10 border w-full">
              <CardHeader>
                <CardTitle className="text-3xl font-bold font-serif text-center mb-4">Pengaturan Jam Kerja</CardTitle>
                <CardDescription className="text-xl text-center">Tentukan parameter absensi dan toleransi keterlambatan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-10 pt-10">
                 <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <Label className="text-xs font-bold uppercase tracking-widest text-primary">Jam Masuk (Start)</Label>
                       <Input type="time" defaultValue="08:00" className="h-16 text-3xl font-bold text-center bg-accent/10 border-border rounded-2xl" />
                    </div>
                    <div className="space-y-4">
                       <Label className="text-xs font-bold uppercase tracking-widest text-primary">Jam Pulang (End)</Label>
                       <Input type="time" defaultValue="17:00" className="h-16 text-3xl font-bold text-center bg-accent/10 border-border rounded-2xl" />
                    </div>
                 </div>
                 
                 <div className="space-y-6 pt-6">
                    <div className="flex items-center justify-between p-6 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                       <div>
                          <p className="font-bold text-xl text-amber-600">Toleransi Terlambat</p>
                          <p className="text-muted-foreground">Karyawan masih dianggap tepat waktu jika masuk sebelum:</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <Input defaultValue="15" className="w-20 h-14 text-center text-xl font-bold rounded-xl" />
                          <span className="font-bold">Menit</span>
                       </div>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-accent/10 rounded-[2rem]">
                       <div className="space-y-1">
                          <p className="font-bold text-xl">Auto-Checkout</p>
                          <p className="text-muted-foreground">Otomatis checkout karyawan pada jam 00:00 jika lupa.</p>
                       </div>
                       <Switch defaultChecked />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-8 w-full">
           <div className="grid gap-8 lg:grid-cols-2 w-full">
              <Card className="bg-card border-border shadow-xl rounded-[2.5rem] p-8 border hover:border-destructive/20 transition-all group">
                 <CardHeader>
                    <CardTitle className="text-2xl font-bold font-serif flex items-center gap-3 text-destructive">
                       <Database /> Maintenance Data
                    </CardTitle>
                    <CardDescription className="text-lg">Bersihkan log sistem atau cadangkan database.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6 pt-6">
                    <Button variant="outline" className="w-full h-16 rounded-2xl border-border hover:bg-accent font-bold text-lg justify-start px-8">
                       <RotateCcw className="mr-4 h-6 w-6" /> Backup Database (SQLite)
                    </Button>
                    <Button variant="outline" className="w-full h-16 rounded-2xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white font-bold text-lg justify-start px-8">
                       <RotateCcw className="mr-4 h-6 w-6" /> Reset Data Percobaan
                    </Button>
                 </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-xl rounded-[2.5rem] p-8 border bg-primary/5 border-primary/20">
                 <CardHeader>
                    <CardTitle className="text-2xl font-bold font-serif flex items-center gap-3">
                       <CheckCircle2 /> System Integrity
                    </CardTitle>
                    <CardDescription className="text-lg">Status kesehatan sistem saat ini.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="font-bold">Database Connection</span>
                          <Badge className="bg-emerald-500 font-bold px-4">Healthy</Badge>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="font-bold">Storage Usage</span>
                          <span className="text-muted-foreground">14.2 MB / 10 GB</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="font-bold">System Version</span>
                          <Badge variant="outline" className="font-bold">v1.2.4-stable</Badge>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
