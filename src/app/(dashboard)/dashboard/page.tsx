"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, Calendar, TrendingUp, ArrowUpRight, Loader2 } from "lucide-react"
import { getDashboardStats } from "@/app/actions/dashboard"
import { useCompany } from "@/context/CompanyContext"

interface DashboardStats {
  totalEmployees: number
  presentToday: number
  pendingLeaves: number
  avgKpi: number
  attendanceRate: number
  weeklyAttendance: { label: string; count: number }[]
  recentLeaves: {
    id: string
    employeeName: string | null
    type: string | null
    status: string | null
    startDate: string | Date
  }[]
}

const EMPTY: DashboardStats = {
  totalEmployees: 0,
  presentToday: 0,
  pendingLeaves: 0,
  avgKpi: 0,
  attendanceRate: 0,
  weeklyAttendance: [],
  recentLeaves: [],
}

const leaveTypeLabel = (type: string | null) => {
  switch (type) {
    case "annual": return "Tahunan"
    case "sick_normal":
    case "sick": return "Sakit"
    case "menstrual": return "Haid"
    case "marriage_self": return "Pernikahan"
    case "birth_wife": return "Kelahiran"
    case "death_immediate": return "Duka"
    case "unpaid": return "Tanpa Gaji"
    default: return "Izin"
  }
}

const statusLabel = (status: string | null) => {
  if (status === "disetujui") return { text: "Approved", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }
  if (status === "ditolak") return { text: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/20" }
  return { text: "Pending", cls: "bg-primary/10 text-primary border-primary/20" }
}

export default function DashboardPage() {
  const { selectedCompany } = useCompany()
  const [stats, setStats] = React.useState<DashboardStats>(EMPTY)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    async function load() {
      if (!selectedCompany) return
      setIsLoading(true)
      const res = await getDashboardStats(selectedCompany.id)
      if (active && res.success && res.data) {
        setStats(res.data as DashboardStats)
      }
      if (active) setIsLoading(false)
    }
    load()
    return () => { active = false }
  }, [selectedCompany])

  const maxWeekly = Math.max(1, ...stats.weeklyAttendance.map(d => d.count))

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Dashboard</h1>
        <p className="text-muted-foreground text-xl font-medium">
          Selamat datang kembali, berikut ringkasan aktivitas {selectedCompany?.name || "perusahaan"}.
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
            <div className="text-6xl font-bold text-foreground tracking-tighter">
              {isLoading ? <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /> : stats.totalEmployees}
            </div>
            <div className="flex items-center gap-2 text-[15px] text-muted-foreground mt-3 font-bold tracking-wide">
              <span>Terdaftar di entitas ini</span>
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
            <div className="text-6xl font-bold text-foreground tracking-tighter">
              {isLoading ? <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /> : (
                <>{stats.presentToday} <span className="text-2xl text-muted-foreground font-medium">/ {stats.totalEmployees}</span></>
              )}
            </div>
            <div className="flex items-center gap-2 text-[15px] text-emerald-500 mt-3 font-bold">
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded">{stats.attendanceRate}%</span>
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
            <div className="text-6xl font-bold text-foreground tracking-tighter">
              {isLoading ? <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /> : stats.pendingLeaves}
            </div>
            <div className="flex items-center gap-2 text-[15px] text-primary mt-3 font-bold tracking-wide">
              <span>{stats.pendingLeaves > 0 ? "Perlu persetujuan segera" : "Tidak ada yang tertunda"}</span>
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
            <div className="text-6xl font-bold text-foreground tracking-tighter">
              {isLoading ? <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /> : (
                stats.avgKpi > 0 ? <>{stats.avgKpi} <span className="text-2xl text-muted-foreground font-medium">/ 100</span></> : "—"
              )}
            </div>
            <div className="flex items-center gap-2 text-[15px] text-muted-foreground mt-3 font-bold tracking-wide">
              <span>{stats.avgKpi > 0 ? "Berdasarkan penilaian tercatat" : "Belum ada penilaian"}</span>
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
            {isLoading ? (
              <div className="h-[320px] flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="h-[320px] w-full flex items-end justify-between gap-4 pt-10 px-4">
                {stats.weeklyAttendance.map((d, i) => {
                  const pct = Math.round((d.count / maxWeekly) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-5 group">
                      <div
                        className="w-full bg-primary/10 group-hover:bg-primary/30 transition-all duration-500 rounded-t-xl relative"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {d.count}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">
                        {d.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card border-border shadow-xl p-4">
          <CardHeader className="pb-10">
            <CardTitle className="text-foreground text-xl font-bold tracking-[0.15em] uppercase">Pengajuan Cuti Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : stats.recentLeaves.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                Belum ada pengajuan cuti.
              </div>
            ) : (
              <div className="space-y-6">
                {stats.recentLeaves.map((item) => {
                  const s = statusLabel(item.status)
                  return (
                    <div key={item.id} className="flex items-center justify-between p-6 rounded-3xl bg-accent/30 hover:bg-accent/50 transition-all duration-300 border border-transparent hover:border-border shadow-sm group">
                      <div className="flex flex-col gap-2">
                        <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{item.employeeName || "—"}</span>
                        <span className="text-sm text-muted-foreground font-bold tracking-wide">
                          {leaveTypeLabel(item.type)} • {new Date(item.startDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                      <div className={`text-[11px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] border shadow-sm ${s.cls}`}>
                        {s.text}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
