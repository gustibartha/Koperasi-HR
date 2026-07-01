"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Clock, AlertCircle, CalendarX, Wallet, Loader2, ArrowRight, Search } from "lucide-react"
import { getAttendanceRecap, type RecapRow } from "@/app/actions/attendance-recap"
import { useCompany } from "@/context/CompanyContext"

export default function AttendanceRecapPage() {
  const { selectedCompany } = useCompany()
  const [month, setMonth] = React.useState(() => new Date().toISOString().slice(0, 7))
  const [rows, setRows] = React.useState<RecapRow[]>([])
  const [isFetching, setIsFetching] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const fetchRecap = React.useCallback(async () => {
    if (!selectedCompany) return
    setIsFetching(true)
    const res = await getAttendanceRecap(selectedCompany.id, month)
    setRows(res.success ? res.data : [])
    setIsFetching(false)
  }, [selectedCompany, month])

  React.useEffect(() => {
    fetchRecap()
  }, [fetchRecap])

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

  const monthLabel = new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))

  const totalLate = rows.reduce((s, r) => s + r.lateDeduction, 0)
  const totalAlpha = rows.reduce((s, r) => s + r.alphaDeduction, 0)
  const totalLeave = rows.reduce((s, r) => s + r.leaveDeduction, 0)
  const grandTotal = totalLate + totalAlpha + totalLeave

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Rekap Absensi</h1>
          <p className="text-muted-foreground text-xl font-medium">
            Penarikan data kehadiran, keterlambatan & alpha yang langsung terhubung ke gaji.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={month}
            max={new Date().toISOString().slice(0, 7)}
            onChange={(e) => setMonth(e.target.value || new Date().toISOString().slice(0, 7))}
            className="h-14 w-auto bg-accent/20 border-border rounded-2xl px-5 font-bold text-lg"
          />
          <a
            href="/payroll"
            className="inline-flex items-center justify-center h-14 px-6 rounded-2xl bg-primary text-primary-foreground font-bold shadow-xl hover:bg-primary/90 transition-all"
          >
            Ke Payroll <ArrowRight className="h-5 w-5 ml-2" />
          </a>
        </div>
      </div>

      {/* Info: connection to salary */}
      <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 text-blue-700">
        <Wallet className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-sm font-medium">
          Angka potongan di bawah dihitung dengan tarif yang sama seperti payroll
          (<strong>telat Rp 5.000/menit</strong>, <strong>alpha Rp 150.000/hari</strong>, <strong>cuti/izin Rp 100.000/hari</strong>).
          Nilai ini otomatis diterapkan saat Anda meng-generate gaji bulan {monthLabel} di menu Payroll.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-8 md:grid-cols-4">
        <Card className="bg-card border-border shadow-xl p-3 rounded-[2rem] relative overflow-hidden group">
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Potongan Telat</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter text-amber-500">{fmt(totalLate)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 rounded-[2rem] relative overflow-hidden group">
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Potongan Alpha</CardTitle>
            <CalendarX className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter text-destructive">{fmt(totalAlpha)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 rounded-[2rem] relative overflow-hidden group">
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Potongan Cuti/Izin</CardTitle>
            <AlertCircle className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter text-primary">{fmt(totalLeave)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary to-primary/80 border-none shadow-xl p-3 rounded-[2rem] relative overflow-hidden text-white">
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold tracking-[0.2em] uppercase opacity-90">Total Potongan Absensi</CardTitle>
            <Wallet className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tighter">{fmt(grandTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-[3rem] border border-border bg-card shadow-2xl overflow-hidden">
        <div className="px-6 md:px-12 py-8 border-b border-border bg-accent/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-3xl font-bold tracking-tight text-foreground font-serif">Rincian per Pegawai</h3>
            <p className="text-lg text-muted-foreground font-medium">Periode {monthLabel}</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari nama karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 bg-accent/10 border-border rounded-2xl font-bold"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-accent/20">
              <TableRow className="hover:bg-transparent border-border h-20">
                <TableHead className="pl-8 text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Pegawai</TableHead>
                <TableHead className="text-center text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Hadir</TableHead>
                <TableHead className="text-center text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Telat</TableHead>
                <TableHead className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Potongan Telat</TableHead>
                <TableHead className="text-center text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Alpha</TableHead>
                <TableHead className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Potongan Alpha</TableHead>
                <TableHead className="text-center text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Cuti</TableHead>
                <TableHead className="text-right pr-8 text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Total Potongan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-[10px]">Memuat Data...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
                    Tidak ada data untuk periode ini.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.employeeId} className="border-border hover:bg-accent/10 transition-colors h-20">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-foreground">{r.name}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{r.position}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {r.presentDays} <span className="text-xs text-muted-foreground font-medium">/ {r.workingDays}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-bold text-amber-500">{r.lateMinutes} mnt</span>
                      <br />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.lateDays} hari</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-500">{fmt(r.lateDeduction)}</TableCell>
                    <TableCell className="text-center font-bold text-destructive">{r.alphaDays} <span className="text-[10px] text-muted-foreground font-medium">hari</span></TableCell>
                    <TableCell className="text-right font-bold text-destructive">{fmt(r.alphaDeduction)}</TableCell>
                    <TableCell className="text-center font-bold">{r.leaveDays} <span className="text-[10px] text-muted-foreground font-medium">hari</span></TableCell>
                    <TableCell className="text-right pr-8 font-bold text-lg text-foreground">{fmt(r.totalDeduction)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
