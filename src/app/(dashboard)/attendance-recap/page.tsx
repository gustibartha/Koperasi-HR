"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Clock, AlertCircle, CalendarX, Wallet, Loader2, ArrowRight, Search, FileDown, CalendarDays, LogIn, LogOut, Printer } from "lucide-react"
import { getAttendanceRecap, exportAttendanceRecapExcel, type RecapRow } from "@/app/actions/attendance-recap"
import { useCompany } from "@/context/CompanyContext"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function AttendanceRecapPage() {
  const { selectedCompany } = useCompany()
  const [month, setMonth] = React.useState(() => new Date().toISOString().slice(0, 7))
  const [rows, setRows] = React.useState<RecapRow[]>([])
  const [isFetching, setIsFetching] = React.useState(true)
  const [isExporting, setIsExporting] = React.useState(false)
  const [isPrinting, setIsPrinting] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [detailEmployee, setDetailEmployee] = React.useState<RecapRow | null>(null)

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

  const handleExportExcel = async () => {
    if (!selectedCompany) return
    setIsExporting(true)
    const res = await exportAttendanceRecapExcel(selectedCompany.id, month)
    setIsExporting(false)
    if (res.success && res.data) {
      const blob = new Blob([Buffer.from(res.data, "base64")], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Rekap_Absensi_${selectedCompany.name.replace(/\s+/g, "_")}_${month}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      alert(res.message || "Gagal mengekspor data.")
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

  const monthLabel = new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  // Cut-off period: 21st of prev month → 20th of the selected month.
  const [pY, pM] = month.split("-").map(Number)
  const fmtDate = (d: Date) => d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
  const periodLabel = `${fmtDate(new Date(pY, pM - 2, 21))} – ${fmtDate(new Date(pY, pM - 1, 20))}`

  const STATUS_LABELS: Record<string, string> = {
    hadir: "Hadir", telat: "Telat", alpha: "Alpha", libur: "Libur", weekend: "Weekend", izin: "Izin/Cuti",
  }

  // Printable PDF: summary page + one detail page per employee, with blank
  // "Lembur" and "Potongan Tambahan" columns so it can be filled by hand and
  // used as the source document for manual overtime/deduction entry in Payroll.
  const handlePrintPDF = () => {
    if (rows.length === 0) return
    setIsPrinting(true)
    try {
      const doc = new jsPDF({ orientation: "landscape" })
      const pageWidth = doc.internal.pageSize.getWidth()

      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(selectedCompany?.name || "KOPERASI HR", pageWidth / 2, 15, { align: "center" })
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text("REKAP ABSENSI BULANAN", pageWidth / 2, 22, { align: "center" })
      doc.setFontSize(9)
      doc.text(`Gaji ${monthLabel} • Periode Absensi ${periodLabel}`, pageWidth / 2, 28, { align: "center" })

      autoTable(doc, {
        startY: 34,
        head: [["Pegawai", "Posisi", "Hadir", "Telat (hari)", "Potongan Telat", "Alpha (hari)", "Potongan Alpha", "Cuti (hari)", "Potongan Cuti", "Total Potongan"]],
        body: rows.map((r) => [
          r.name, r.position, `${r.presentDays}/${r.workingDays}`, r.lateDays, fmt(r.lateDeduction),
          r.alphaDays, fmt(r.alphaDeduction), r.leaveDays, fmt(r.leaveDeduction), fmt(r.totalDeduction),
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        columnStyles: { 4: { halign: "right" }, 6: { halign: "right" }, 8: { halign: "right" }, 9: { halign: "right" } },
      })

      // One detail page per employee: daily masuk/keluar + blank columns for
      // hand-written lembur (overtime) hours and extra deduction notes.
      rows.forEach((r) => {
        doc.addPage()
        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        doc.text(`Detail Harian — ${r.name}`, 14, 15)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.text(`${r.position} • Periode ${periodLabel}`, 14, 21)

        autoTable(doc, {
          startY: 26,
          head: [["Tanggal", "Masuk", "Keluar", "Status", "Keterangan", "Lembur (Jam)", "Potongan Tambahan (Rp)"]],
          body: r.dailyLogs.map((d) => [
            d.dayLabel, d.clockIn || "-", d.clockOut || "-", STATUS_LABELS[d.status] || d.status, d.note || "", "", "",
          ]),
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
          columnStyles: { 5: { cellWidth: 30 }, 6: { cellWidth: 40 } },
        })

        const finalY = (doc as any).lastAutoTable.finalY + 15
        doc.setFontSize(9)
        doc.text("Diisi oleh (Admin/HR):", 14, finalY)
        doc.text("Diperiksa oleh:", 110, finalY)
        doc.text("_______________________", 14, finalY + 15)
        doc.text("_______________________", 110, finalY + 15)
      })

      doc.save(`Rekap_Absensi_${(selectedCompany?.name || "").replace(/\s+/g, "_")}_${month}.pdf`)
    } finally {
      setIsPrinting(false)
    }
  }
  // PT Wira Karya Sinergi uses a fixed-tariff SK formula instead of the generic rate.
  const usesWksTariff = selectedCompany?.id === "279bfb86-1b29-4b69-8e7c-5c9ac51a0c7e"

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
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="month"
            value={month}
            max={new Date().toISOString().slice(0, 7)}
            onChange={(e) => setMonth(e.target.value || new Date().toISOString().slice(0, 7))}
            className="h-14 w-auto bg-accent/20 border-border text-foreground rounded-2xl px-5 font-bold text-lg [color-scheme:light] dark:[color-scheme:dark]"
          />
          <Button
            onClick={handleExportExcel}
            disabled={isExporting || isFetching || rows.length === 0}
            variant="outline"
            className="h-14 px-6 rounded-2xl border-border font-bold gap-2"
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
            Export Excel
          </Button>
          <Button
            onClick={handlePrintPDF}
            disabled={isPrinting || isFetching || rows.length === 0}
            variant="outline"
            className="h-14 px-6 rounded-2xl border-border font-bold gap-2"
          >
            {isPrinting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
            Cetak PDF
          </Button>
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
          Periode gaji <strong>{monthLabel}</strong> dihitung dari absensi <strong>{periodLabel}</strong> (cut-off tanggal 20).{" "}
          {usesWksTariff ? (
            <>
              Entitas ini memakai <strong>tarif tetap sesuai SK PT Wira Karya Sinergi</strong>: keterlambatan &amp; pulang awal
              dipotong bertingkat (<strong>Rp 10.000 / Rp 20.000 / Rp 30.000</strong> tergantung rentang waktu), dan alpha
              dihitung <strong>Total Upah × 1/22 × hari alpha</strong> (estimasi berbasis gaji payroll terakhir). Cuti/izin
              tetap <strong>Rp 100.000/hari</strong>.
            </>
          ) : (
            <>
              Tarif sama seperti payroll: <strong>telat Rp 5.000/menit</strong>, <strong>alpha Rp 150.000/hari</strong>,{" "}
              <strong>cuti/izin Rp 100.000/hari</strong>.
            </>
          )}{" "}
          Nilai ini otomatis diterapkan saat generate gaji di menu Payroll.
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
            <p className="text-lg text-muted-foreground font-medium">Gaji {monthLabel} • Periode {periodLabel}</p>
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
                <TableHead className="text-right text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Total Potongan</TableHead>
                <TableHead className="text-right pr-8 text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-[10px]">Memuat Data...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">
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
                      {r.usesWksTariff ? (
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Tarif SK</span>
                      ) : (
                        <span className="font-bold text-amber-500">{r.lateMinutes} mnt</span>
                      )}
                      <br />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{r.lateDays} hari</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-500">{fmt(r.lateDeduction)}</TableCell>
                    <TableCell className="text-center font-bold text-destructive">{r.alphaDays} <span className="text-[10px] text-muted-foreground font-medium">hari</span></TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {fmt(r.alphaDeduction)}
                      {r.usesWksTariff && r.alphaDays > 0 && !r.alphaBasisMonth && (
                        <div className="text-[9px] font-bold text-muted-foreground normal-case mt-0.5">Belum ada payroll acuan</div>
                      )}
                      {r.usesWksTariff && r.alphaBasisMonth && (
                        <div className="text-[9px] font-bold text-muted-foreground normal-case mt-0.5">Estimasi dr. gaji {r.alphaBasisMonth}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-bold">{r.leaveDays} <span className="text-[10px] text-muted-foreground font-medium">hari</span></TableCell>
                    <TableCell className="text-right font-bold text-lg text-foreground">{fmt(r.totalDeduction)}</TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailEmployee(r)}
                        className="font-bold border-border rounded-xl gap-2"
                      >
                        <CalendarDays className="h-4 w-4" /> Detail Harian
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Daily In/Out Detail Dialog */}
      <Dialog open={!!detailEmployee} onOpenChange={(o) => { if (!o) setDetailEmployee(null) }}>
        <DialogContent className="sm:max-w-[700px] bg-popover border-border rounded-[2.5rem] p-0 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <DialogHeader className="p-8 pb-5 bg-accent/5 border-b border-border">
            <DialogTitle className="text-2xl font-bold font-serif">Detail Harian — {detailEmployee?.name}</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Jam masuk & keluar tiap hari, periode {periodLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <Table>
              <TableHeader className="bg-accent/20 sticky top-0">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-widest">Tanggal</TableHead>
                  <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest">Masuk</TableHead>
                  <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest">Keluar</TableHead>
                  <TableHead className="text-center text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                  <TableHead className="pr-6 text-[10px] font-bold uppercase tracking-widest">Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailEmployee?.dailyLogs.map((d) => {
                  const statusStyle: Record<string, string> = {
                    hadir: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    telat: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    alpha: "bg-red-500/10 text-red-600 border-red-500/20",
                    libur: "bg-purple-500/10 text-purple-500 border-purple-500/20",
                    weekend: "bg-accent/30 text-muted-foreground border-border",
                    izin: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                  }
                  const statusLabel: Record<string, string> = {
                    hadir: "Hadir", telat: "Telat", alpha: "Alpha", libur: "Libur", weekend: "Weekend", izin: "Izin/Cuti",
                  }
                  return (
                    <TableRow key={d.date} className="border-border/60">
                      <TableCell className="pl-6 text-sm font-bold">{d.dayLabel}</TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {d.clockIn ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600"><LogIn className="h-3 w-3" />{d.clockIn}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">
                        {d.clockOut ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><LogOut className="h-3 w-3" />{d.clockOut}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${statusStyle[d.status]}`}>
                          {statusLabel[d.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-xs text-muted-foreground font-medium">{d.note || "-"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
