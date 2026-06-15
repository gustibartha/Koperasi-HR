"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Calendar as CalendarIcon, FileText, Search, Users, UserCheck, Clock, Info, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { requestLeave, updateLeaveStatus, getAllLeaves, getLeaveBalances } from "@/app/actions/leave"
import { ANNUAL_LEAVE_QUOTA } from "@/lib/leave-constants"
import { getEmployees } from "@/app/actions/employee"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useCompany } from "@/context/CompanyContext"


export default function LeavePage() {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isFetching, setIsFetching] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [leaveList, setLeaveList] = React.useState<any[]>([])
  const [employeeList, setEmployeeList] = React.useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = React.useState<any>(null)
  const [balances, setBalances] = React.useState<Record<string, { annualUsed: number; sickUsed: number; importantCount: number }>>({})
  const { selectedCompany } = useCompany()

  const getBalance = (empId: string) => balances[empId] || { annualUsed: 0, sickUsed: 0, importantCount: 0 }

  const [formData, setFormData] = React.useState({
    employeeId: "",
    type: "annual",
    startDate: "",
    endDate: "",
    reason: "",
  })

  const fetchLeaves = React.useCallback(async () => {
    if (!selectedCompany) return
    setIsFetching(true)
    const res = await getAllLeaves(selectedCompany.id)
    if (res.success) setLeaveList(res.data || [])

    const empRes = await getEmployees(selectedCompany.id)
    if (empRes.success) setEmployeeList(empRes.data || [])

    const balRes = await getLeaveBalances(selectedCompany.id)
    if (balRes.success) setBalances(balRes.data || {})

    setIsFetching(false)
  }, [selectedCompany])

  React.useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.startDate || !formData.endDate || !formData.reason) {
      alert("Mohon lengkapi semua data pengajuan")
      return
    }

    setIsSubmitting(true)
    const res = await requestLeave(
      formData.employeeId,
      new Date(formData.startDate),
      new Date(formData.endDate),
      formData.reason,
      formData.type,
      selectedCompany.id
    )
    setIsSubmitting(false)

    if (res.success) {
      setOpen(false)
      fetchLeaves()
      setFormData({ employeeId: "", type: "annual", startDate: "", endDate: "", reason: "" })
      alert("Pengajuan cuti berhasil dikirim ke Approval Center!")
    } else {
      alert(res.message)
    }
  }

  const handleStatusUpdate = async (id: string, status: any) => {
    const res = await updateLeaveStatus(id, status)
    if (res.success) {
      fetchLeaves()
    } else {
      alert(res.message)
    }
  }

  // Real aggregate stats
  const totalAnnualTaken = Object.values(balances).reduce((sum, b) => sum + b.annualUsed, 0)
  const pendingCount = leaveList.filter((l) => l.status === "menunggu").length
  const onLeaveTodayCount = (() => {
    const today = new Date()
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    return leaveList.filter((l) => {
      if (l.status !== "disetujui") return false
      const start = new Date(l.startDate); start.setHours(0, 0, 0, 0)
      const end = new Date(l.endDate); end.setHours(23, 59, 59, 999)
      return t >= start.getTime() && t <= end.getTime()
    }).length
  })()

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/10 text-primary border-none font-bold px-3 py-1 text-[10px] tracking-widest uppercase">Admin Mode</Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Leave Management</h1>
          </div>
          <p className="text-muted-foreground text-xl font-medium">
            Centralized control for employee leave requests and annual quotas.
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-14 text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
            <Plus className="mr-3 h-6 w-6 stroke-[2.5]" /> Input Pengajuan Manual
          </Button>} />
          <DialogContent className="sm:max-w-[700px] bg-popover border-border rounded-[2.5rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader className="space-y-6">
              <DialogTitle className="text-4xl font-bold tracking-tight font-serif text-foreground">Input Pengajuan Cuti/Izin</DialogTitle>
              <DialogDescription className="text-xl text-muted-foreground">
                Gunakan formulir ini untuk menginput pengajuan atas nama pegawai.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-10 py-10">
              <div className="grid gap-4">
                <Label className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Pilih Pegawai</Label>
                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, employeeId: val }))}>
                  <SelectTrigger className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus:ring-primary font-bold">
                    <SelectValue placeholder="Pilih Pegawai..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border rounded-2xl">
                    {employeeList.map(emp => (
                      <SelectItem key={emp.id} value={emp.id} className="text-lg py-3 px-5 rounded-xl font-bold">{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4">
                <Label htmlFor="type" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Kategori Izin</Label>
                <Select onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))} defaultValue="annual">
                  <SelectTrigger className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus:ring-primary font-bold">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={8} align="start" alignItemWithTrigger={false} className="bg-popover border-border rounded-2xl shadow-3xl min-w-[450px] p-2 z-[60]">
                    <SelectGroup>
                      <SelectLabel className="text-primary font-bold px-5 py-2 text-sm uppercase tracking-widest">Cuti</SelectLabel>
                      <SelectItem className="text-base py-2.5 px-5 rounded-xl font-bold" value="annual">Cuti Tahunan</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-primary font-bold px-5 py-2 text-sm uppercase tracking-widest border-t border-border mt-2">Izin Sakit & Kesehatan</SelectLabel>
                      <SelectItem className="text-base py-2.5 px-5 rounded-xl font-bold" value="sick_normal">Izin Sakit (Bukan Kecelakaan Kerja)</SelectItem>
                      <SelectItem className="text-base py-2.5 px-5 rounded-xl font-bold" value="menstrual">Izin Istirahat Haid (Hari 1 & 2)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-primary font-bold px-5 py-2 text-sm uppercase tracking-widest border-t border-border mt-2">Izin Alasan Penting</SelectLabel>
                      <SelectItem className="text-base py-2.5 px-5 rounded-xl font-bold" value="marriage_self">Pernikahan Karyawan (5 Hari)</SelectItem>
                      <SelectItem className="text-base py-2.5 px-5 rounded-xl font-bold" value="birth_wife">Istri Melahirkan (2 Hari)</SelectItem>
                      <SelectItem className="text-base py-2.5 px-5 rounded-xl font-bold" value="death_immediate">Keluarga Inti Meninggal (2 Hari)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="grid gap-4">
                    <Label htmlFor="start" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Start Date</Label>
                    <Input id="start" type="date" value={formData.startDate} onChange={(e) => setFormData(p => ({...p, startDate: e.target.value}))} className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold" />
                  </div>
                  <div className="grid gap-4">
                    <Label htmlFor="end" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">End Date</Label>
                    <Input id="end" type="date" value={formData.endDate} onChange={(e) => setFormData(p => ({...p, endDate: e.target.value}))} className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold" />
                  </div>
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="reason" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Detailed Reason</Label>
                  <Textarea id="reason" value={formData.reason} onChange={(e) => setFormData(p => ({...p, reason: e.target.value}))} placeholder="Keterangan pengajuan..." className="min-h-[150px] text-xl bg-accent/30 border-border rounded-2xl px-6 py-5 focus-visible:ring-primary font-medium" />
                </div>
            </div>
            <DialogFooter className="pt-6 gap-6">
              <Button variant="outline" onClick={() => setOpen(false)} className="h-16 px-10 text-xl font-bold border-border rounded-2xl hover:bg-accent transition-all">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="h-16 px-12 text-xl font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                {isSubmitting && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Aggregate Statistics */}
      <div className="grid gap-8 md:grid-cols-3">
        <Card className="bg-card border-border shadow-xl p-3 group relative overflow-hidden rounded-[2.5rem] transition-all hover:border-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-8 -mt-8 group-hover:bg-primary/10 transition-all duration-700"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Total Cuti Tahunan</CardTitle>
            <UserCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-7xl font-bold text-foreground tracking-tighter">{totalAnnualTaken} <span className="text-2xl text-muted-foreground font-medium italic">Hari Diambil</span></div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-4">Seluruh Karyawan • Disetujui</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 group relative overflow-hidden rounded-[2.5rem] transition-all hover:border-amber-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-8 -mt-8 group-hover:bg-amber-500/10 transition-all duration-700"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Pending Approval</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-7xl font-bold text-amber-500 tracking-tighter">{String(pendingCount).padStart(2, "0")} <span className="text-2xl text-muted-foreground font-medium italic">Pengajuan</span></div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-4">Butuh Tindakan Segera</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 group relative overflow-hidden rounded-[2.5rem] transition-all hover:border-emerald-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-all duration-700"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Izin Hari Ini</CardTitle>
            <Users className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-7xl font-bold text-emerald-500 tracking-tighter">{String(onLeaveTodayCount).padStart(2, "0")} <span className="text-2xl text-muted-foreground font-medium italic">Pegawai</span></div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-4">Sedang Tidak Di Kantor</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Leave Quotas */}
      <div className="rounded-[3rem] border border-border bg-card shadow-2xl overflow-hidden">
        <div className="px-6 md:px-12 py-8 md:py-10 border-b border-border bg-accent/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-0">
          <div>
            <h3 className="text-3xl font-bold tracking-tight text-foreground font-serif">Sisa Jatah Cuti Karyawan</h3>
            <p className="text-xl text-muted-foreground font-medium">Monitoring saldo cuti tahunan dan izin per pegawai.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Cari nama karyawan..." 
              className="pl-12 h-14 bg-accent/10 border-border rounded-2xl font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-accent/20">
            <TableRow className="hover:bg-transparent border-border h-24">
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] pl-12">Karyawan</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] text-center">Cuti Tahunan</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] text-center">Alasan Penting</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] text-center">Izin Sakit</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] text-right pr-12">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                   <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-[10px]">Memuat Data...</p>
                </TableCell>
              </TableRow>
            ) : employeeList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">Belum ada data pegawai.</TableCell>
              </TableRow>
            ) : employeeList.map((emp) => (
              <TableRow key={emp.id} className="border-border hover:bg-accent/10 transition-colors h-24">
                <TableCell className="pl-12">
                   <div className="flex flex-col">
                      <span className="font-bold text-xl text-foreground">{emp.name}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{emp.position} • {emp.id}</span>
                   </div>
                </TableCell>
                <TableCell className="text-center">
                   <span className="text-3xl font-bold text-primary tracking-tighter">{ANNUAL_LEAVE_QUOTA - getBalance(emp.id).annualUsed} <span className="text-xs text-muted-foreground font-medium">/ {ANNUAL_LEAVE_QUOTA} Hari</span></span>
                </TableCell>
                <TableCell className="text-center text-xl font-bold text-foreground">{getBalance(emp.id).importantCount} <span className="text-xs text-muted-foreground font-medium">Kali</span></TableCell>
                <TableCell className="text-center text-xl font-bold text-foreground">{getBalance(emp.id).sickUsed} <span className="text-xs text-muted-foreground font-medium">Hari</span></TableCell>
                <TableCell className="text-right pr-12">
                   <Dialog>
                     <DialogTrigger render={<Button variant="outline" className="h-12 px-6 font-bold border-border rounded-xl hover:bg-primary hover:text-white transition-all">
                        Detail Saldo
                      </Button>} />
                     <DialogContent className="sm:max-w-[500px] bg-popover border-border rounded-[2.5rem] p-10 shadow-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-3xl font-bold font-serif text-foreground">Detail Saldo Cuti</DialogTitle>
                          <DialogDescription className="text-lg text-muted-foreground mt-2">
                            Rincian kuota untuk {emp.name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-8 space-y-6">
                           <div className="flex justify-between items-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                              <span className="font-bold text-lg text-muted-foreground uppercase tracking-widest text-xs">Sisa Cuti Tahunan</span>
                              <span className="text-3xl font-bold text-primary">{ANNUAL_LEAVE_QUOTA - getBalance(emp.id).annualUsed} / {ANNUAL_LEAVE_QUOTA} <span className="text-sm font-medium">Hari</span></span>
                           </div>
                           <div className="flex justify-between items-center p-6 bg-accent/20 rounded-2xl border border-border">
                              <span className="font-bold text-lg text-muted-foreground uppercase tracking-widest text-xs">Cuti Tahunan Terpakai</span>
                              <span className="text-3xl font-bold text-foreground">{getBalance(emp.id).annualUsed} <span className="text-sm font-medium">Hari</span></span>
                           </div>
                           <div className="flex justify-between items-center p-6 bg-accent/20 rounded-2xl border border-border">
                              <span className="font-bold text-lg text-muted-foreground uppercase tracking-widest text-xs">Izin Alasan Penting</span>
                              <span className="text-3xl font-bold text-foreground">{getBalance(emp.id).importantCount} <span className="text-sm font-medium">Kali</span></span>
                           </div>
                           <div className="flex justify-between items-center p-6 bg-accent/20 rounded-2xl border border-border">
                              <span className="font-bold text-lg text-muted-foreground uppercase tracking-widest text-xs">Izin Sakit</span>
                              <span className="text-3xl font-bold text-foreground">{getBalance(emp.id).sickUsed} <span className="text-sm font-medium">Hari</span></span>
                           </div>
                        </div>

                        <DialogFooter>
                           <DialogClose render={<Button className="w-full h-14 rounded-xl font-bold text-lg bg-primary" />}>
                              Tutup
                           </DialogClose>
                        </DialogFooter>
                     </DialogContent>
                   </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* History Table with Name Column */}
      <div className="rounded-[3rem] border border-border bg-card shadow-2xl overflow-hidden">
        <div className="px-12 py-10 border-b border-border bg-accent/5">
          <h3 className="text-3xl font-bold tracking-tight text-foreground font-serif">Recent Leave & Permit Requests</h3>
          <p className="text-xl text-muted-foreground font-medium">Log riwayat pengajuan cuti dan izin seluruh karyawan.</p>
        </div>
        <Table>
          <TableHeader className="bg-accent/20">
            <TableRow className="hover:bg-transparent border-border h-24">
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] pl-12">Nama Pegawai</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em]">Kategori</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em]">Periode</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em]">Status</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-xs tracking-[0.2em] text-right pr-12">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                   <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-[10px]">Memuat Data...</p>
                </TableCell>
              </TableRow>
            ) : leaveList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">Belum ada riwayat pengajuan.</TableCell>
              </TableRow>
            ) : leaveList.map((request) => (
              <TableRow key={request.id} className="border-border hover:bg-accent/10 transition-colors h-28">
                <TableCell className="pl-12">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center font-bold text-primary shadow-inner text-xs">
                         {request.employeeName?.split(' ').map((n: string) => n[0]).join('') || "?"}
                      </div>
                      <span className="font-bold text-xl text-foreground">{request.employeeName}</span>
                   </div>
                </TableCell>
                <TableCell className="font-bold text-foreground text-xl">
                   <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-primary/60" />
                    Cuti / Izin
                   </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-lg font-bold">
                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                   <Badge className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border shadow-none ${
                    request.status === 'disetujui' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : request.status === 'menunggu'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                   }`}>
                    {request.status}
                   </Badge>
                </TableCell>
                <TableCell className="text-right pr-12">
                   <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusUpdate(request.id, "disetujui")}
                    className="mr-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl font-bold"
                   >Setujui</Button>
                   <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStatusUpdate(request.id, "ditolak")}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-white rounded-xl font-bold"
                   >Tolak</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
