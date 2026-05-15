import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, Calendar, TrendingUp, ArrowUpRight } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Dashboard</h1>
        <p className="text-muted-foreground text-xl font-medium">
          Selamat datang kembali, berikut ringkasan aktivitas hari ini.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Employees */}
        <Card className="bg-card border-border shadow-xl relative group p-3 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all duration-700"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Total Pegawai</CardTitle>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-sm">
              <Users className="h-6 w-6 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-foreground tracking-tighter">42</div>
            <div className="flex items-center gap-2 text-[15px] text-emerald-500 mt-3 font-bold">
              <ArrowUpRight className="h-5 w-5 stroke-[3]" />
              <span>+2 bulan ini</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card className="bg-card border-border shadow-xl relative group p-3 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all duration-700"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Kehadiran Hari Ini</CardTitle>
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-sm">
              <Clock className="h-6 w-6 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-foreground tracking-tighter">38 <span className="text-2xl text-muted-foreground font-medium">/ 42</span></div>
            <div className="flex items-center gap-2 text-[15px] text-emerald-500 mt-3 font-bold">
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded">90.5%</span>
              <span className="text-muted-foreground font-medium tracking-wide">rate kehadiran</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Leaves */}
        <Card className="bg-card border-border shadow-xl relative group p-3 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all duration-700"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Pengajuan Cuti</CardTitle>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-sm">
              <Calendar className="h-6 w-6 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-foreground tracking-tighter">5</div>
            <div className="flex items-center gap-2 text-[15px] text-primary mt-3 font-bold tracking-wide">
              <span>Perlu persetujuan segera</span>
            </div>
          </CardContent>
        </Card>

        {/* Avg KPI */}
        <Card className="bg-card border-border shadow-xl relative group p-3 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all duration-700"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Rata-rata KPI</CardTitle>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-sm">
              <TrendingUp className="h-6 w-6 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-foreground tracking-tighter">8.4 <span className="text-2xl text-muted-foreground font-medium">/ 10</span></div>
            <div className="flex items-center gap-2 text-[15px] text-emerald-500 mt-3 font-bold">
              <ArrowUpRight className="h-5 w-5 stroke-[3]" />
              <span>+0.2 dari bulan lalu</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card border-border shadow-xl p-4">
          <CardHeader className="pb-10">
            <CardTitle className="text-foreground text-xl font-bold tracking-[0.15em] uppercase">Tren Kehadiran Mingguan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full flex items-end justify-between gap-4 pt-10 px-4">
              {[60, 80, 40, 90, 70, 85, 95].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-5 group">
                  <div 
                    className="w-full bg-primary/10 group-hover:bg-primary/30 transition-all duration-500 rounded-t-xl relative" 
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {h}%
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-card border-border shadow-xl p-4">
          <CardHeader className="pb-10">
            <CardTitle className="text-foreground text-xl font-bold tracking-[0.15em] uppercase">Pengajuan Cuti Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: "Ahmad Sudirman", type: "Tahunan", date: "28 Apr", status: "Pending" },
                { name: "Siti Aminah", type: "Sakit", date: "27 Apr", status: "Approved" },
                { name: "Budi Santoso", type: "Tahunan", date: "25 Apr", status: "Rejected" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-accent/30 hover:bg-accent/50 transition-all duration-300 border border-transparent hover:border-border shadow-sm group">
                  <div className="flex flex-col gap-2">
                    <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                    <span className="text-sm text-muted-foreground font-bold tracking-wide">{item.type} • {item.date}</span>
                  </div>
                  <div className={`text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] border shadow-sm ${
                    item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    item.status === 'Rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                    'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
