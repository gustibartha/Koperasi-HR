"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  Plus, 
  FileText, 
  Banknote, 
  Clock, 
  Upload, 
  FileSpreadsheet, 
  FileDown, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Search,
  Wallet,
  Eye,
  Loader2
} from "lucide-react"
import { 
  calculateAndGeneratePayroll, 
  getAllPayrolls, 
  generatePayrollTemplate 
} from "@/app/actions/payroll"
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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { useCompany } from "@/context/CompanyContext"


export default function PayrollPage() {
  const [isFetching, setIsFetching] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [payrollList, setPayrollList] = React.useState<any[]>([])
  const [employeeList, setEmployeeList] = React.useState<any[]>([])
  const [openInput, setOpenInput] = React.useState(false)
  const [openImport, setOpenImport] = React.useState(false)
  const { selectedCompany } = useCompany()

  // State for form inputs
  const [formData, setFormData] = React.useState({
    employeeId: "",
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    basicSalary: "",
    mealAllowance: "",
    positionAllowance: "",
    competencyAllowance: "",
    phoneAllowance: "",
    premi: "",
    overtimeAmount: "",
    overtimeMeal: "",
    coopLoan: "",
    shopDeduction: "",
    jamsostek: "",
    bpjsHealth: "",
    otherDeduction: ""
  })

  const fetchPayrolls = React.useCallback(async () => {
    if (!selectedCompany) {
      setIsFetching(false)
      return
    }
    setIsFetching(true)
    const res = await getAllPayrolls(selectedCompany.id)
    if (res.success) setPayrollList(res.data || [])

    const empRes = await getEmployees(selectedCompany.id)
    if (empRes.success) setEmployeeList(empRes.data || [])
    setIsFetching(false)
  }, [selectedCompany])

  // Fetch on mount and when selectedCompany changes
  React.useEffect(() => {
    if (selectedCompany) {
      fetchPayrolls()
    }
  }, [selectedCompany, fetchPayrolls])

  const handleGenerate = async () => {
    if (!formData.employeeId || !formData.basicSalary) {
      alert("Pilih pegawai dan masukkan gaji pokok")
      return
    }

    setIsSubmitting(true)
    const extras = {
      mealAllowance: parseNumber(formData.mealAllowance),
      positionAllowance: parseNumber(formData.positionAllowance),
      competencyAllowance: parseNumber(formData.competencyAllowance),
      phoneAllowance: parseNumber(formData.phoneAllowance),
      premi: parseNumber(formData.premi),
      overtimeAmount: parseNumber(formData.overtimeAmount),
      overtimeMeal: parseNumber(formData.overtimeMeal),
      shopDeduction: parseNumber(formData.shopDeduction),
      jamsostek: parseNumber(formData.jamsostek),
      bpjsHealth: parseNumber(formData.bpjsHealth),
      otherDeduction: parseNumber(formData.otherDeduction),
    }

    const res = await calculateAndGeneratePayroll(
      formData.employeeId,
      formData.month,
      parseNumber(formData.basicSalary),
      extras,
      selectedCompany.id
    )
    setIsSubmitting(false)

    if (res.success) {
      setOpenInput(false)
      fetchPayrolls()
      setFormData({ employeeId: "", month: new Date().toISOString().slice(0, 7), basicSalary: "" })
    } else {
      alert(res.message)
    }
  }

  const handleDownloadTemplate = async () => {
    const res = await generatePayrollTemplate()
    if (res.success && res.data) {
      const blob = new Blob([Buffer.from(res.data, "base64")], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "Payroll_Template.xlsx"
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  // Format number with dots
  const formatNumber = (val: string) => {
    if (!val) return ""
    const num = val.replace(/\D/g, "")
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  // Parse formatted string back to number
  const parseNumber = (val: string) => {
    return parseInt(val.replace(/\./g, "")) || 0
  }

  const handleInputChange = (key: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: formatNumber(value) }))
  }

  // Calculate THP
  const calculateTHP = () => {
    const earnings = parseNumber(formData.basicSalary) + 
                     parseNumber(formData.mealAllowance) + 
                     parseNumber(formData.positionAllowance) + 
                     parseNumber(formData.competencyAllowance) + 
                     parseNumber(formData.phoneAllowance) + 
                     parseNumber(formData.premi) + 
                     parseNumber(formData.overtimeAmount) + 
                     parseNumber(formData.overtimeMeal)
    
    const deductions = parseNumber(formData.coopLoan) + 
                       parseNumber(formData.shopDeduction) + 
                       parseNumber(formData.jamsostek) + 
                       parseNumber(formData.bpjsHealth) + 
                       parseNumber(formData.otherDeduction)
    
    return earnings - deductions
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Real aggregate stats
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const currentMonthLabel = new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })
  const totalPayrollThisMonth = payrollList
    .filter(p => p.month === currentMonth)
    .reduce((sum, p) => sum + (p.netSalary || 0), 0)

  const downloadPDFSlip = (data: any) => {
    const doc = new jsPDF()
    doc.setFontSize(22)
    doc.setTextColor(40, 40, 40)
    doc.text(selectedCompany?.name || "KOPERASI HR", 105, 20, { align: "center" })
    doc.setFontSize(10)
    doc.text(selectedCompany?.address || "Jakarta, Indonesia", 105, 27, { align: "center" })
    doc.setLineWidth(0.5)
    doc.line(20, 35, 190, 35)
    doc.setFontSize(16)
    doc.text("SLIP GAJI KARYAWAN", 105, 45, { align: "center" })
    doc.setFontSize(11)
    doc.text(`Nama: ${data.employeeName}`, 20, 60)
    doc.text(`Jabatan: Staff`, 20, 67)
    doc.text(`Periode: ${data.month}`, 140, 60)
    doc.text(`Status: FINALIZED`, 140, 67)
    
    const earningsBody = [
      ["Gaji Pokok", formatCurrency(data.basicSalary)],
      ["Uang Makan", formatCurrency(data.mealAllowance || 0)],
      ["Tunjangan Jabatan", formatCurrency(data.positionAllowance || 0)],
      ["Tunjangan Kompetensi", formatCurrency(data.competencyAllowance || 0)],
      ["Tunjangan HP", formatCurrency(data.phoneAllowance || 0)],
      ["Premi", formatCurrency(data.premi || 0)],
      ["Lembur (Jam)", formatCurrency(data.overtimeAmount || 0)],
      ["Lembur (Makan)", formatCurrency(data.overtimeMeal || 0)],
    ].filter(row => row[1] !== formatCurrency(0) || row[0] === "Gaji Pokok");

    const totalEarnings = data.basicSalary + (data.mealAllowance || 0) + (data.positionAllowance || 0) + 
                          (data.competencyAllowance || 0) + (data.phoneAllowance || 0) + (data.premi || 0) + 
                          (data.overtimeAmount || 0) + (data.overtimeMeal || 0);

    const deductionsBody = [
      ["Potongan Pinjaman (Koperasi)", formatCurrency(data.loanDeduction || 0)],
      ["Potongan Toko", formatCurrency(data.shopDeduction || 0)],
      ["Jamsostek", formatCurrency(data.jamsostek || 0)],
      ["BPJS Kesehatan", formatCurrency(data.bpjsHealth || 0)],
      ["Denda Terlambat (Absensi)", formatCurrency(data.lateDeduction || 0)],
      ["Potongan Izin/Cuti", formatCurrency(data.leaveDeduction || 0)],
      ["Potongan Lainnya", formatCurrency(data.otherDeduction || 0)],
    ].filter(row => row[1] !== formatCurrency(0));

    const totalDeductions = (data.loanDeduction || 0) + (data.shopDeduction || 0) + (data.jamsostek || 0) + 
                            (data.bpjsHealth || 0) + (data.lateDeduction || 0) + (data.leaveDeduction || 0) + 
                            (data.otherDeduction || 0);

    doc.setFontSize(12)
    doc.text("I. PENERIMAAN", 20, 75)
    autoTable(doc, {
      startY: 78,
      head: [["Deskripsi", "Jumlah"]],
      body: [
        ...earningsBody,
        [{ content: "TOTAL PENERIMAAN BRUTO", styles: { fontStyle: "bold" } }, { content: formatCurrency(totalEarnings), styles: { fontStyle: "bold" } }],
      ],
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: "right" } }
    })

    const nextY = (doc as any).lastAutoTable.finalY + 10
    doc.text("II. POTONGAN", 20, nextY)
    autoTable(doc, {
      startY: nextY + 3,
      head: [["Deskripsi", "Jumlah"]],
      body: [
        ...deductionsBody,
        [{ content: "TOTAL POTONGAN", styles: { fontStyle: "bold" } }, { content: formatCurrency(totalDeductions), styles: { fontStyle: "bold" } }],
      ],
      theme: "striped",
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255] },
      columnStyles: { 1: { halign: "right" } }
    })
    
    const finalY = (doc as any).lastAutoTable.finalY || 150
    doc.setFillColor(30, 41, 59)
    doc.rect(20, finalY + 10, 170, 15, "F")
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.text("TAKE HOME PAY (NET):", 25, finalY + 20)
    doc.text(formatCurrency(data.netSalary), 185, finalY + 20, { align: "right" })
    
    doc.setTextColor(40, 40, 40)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Dibuat Secara Otomatis oleh Sistem HR Kowika", 105, finalY + 45, { align: "center" })
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString()}`, 105, finalY + 50, { align: "center" })
    doc.save(`Slip_Gaji_${data.employeeName.replace(" ", "_")}_${data.month.replace(" ", "_")}.pdf`)
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Payroll Management</h1>
          <p className="text-muted-foreground text-xl font-medium">Sistem penggajian otomatis dengan alur persetujuan berjenjang.</p>
        </div>

        <div className="flex items-center gap-4">
           <Dialog open={openImport} onOpenChange={setOpenImport}>
            <DialogTrigger render={<Button variant="outline" className="border-border hover:bg-accent font-bold px-6 h-14 text-lg rounded-2xl">
              <Upload className="mr-3 h-5 w-5" /> Import Excel
            </Button>} />
            <DialogContent className="sm:max-w-[650px] bg-popover border-border rounded-[2.5rem] p-10 shadow-2xl">
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-3xl font-bold font-serif">Import Payroll Spreadsheet</DialogTitle>
                <DialogDescription className="text-lg">Upload data gaji bulanan untuk diproses persetujuannya.</DialogDescription>
              </DialogHeader>
              <div className="py-10">
                <div className="border-2 border-dashed border-border rounded-[2rem] p-12 flex flex-col items-center gap-6 bg-accent/10 hover:bg-accent/20 transition-all cursor-pointer text-center relative group">
                   <div className="p-6 bg-secondary/10 rounded-full"><FileSpreadsheet className="h-12 w-12 text-secondary" /></div>
                   <div>
                      <p className="text-xl font-bold">Upload File Perhitungan Gaji</p>
                      <p className="text-muted-foreground">Pilih file .xlsx untuk memulai workflow</p>
                   </div>
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".xlsx" />
                </div>
                <div className="mt-8 flex justify-center">
                  <Button variant="link" onClick={handleDownloadTemplate} className="text-primary font-bold">
                    <Download className="mr-2 h-4 w-4" /> Download Template Excel (.xlsx)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openInput} onOpenChange={setOpenInput}>
            <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-14 text-lg rounded-2xl shadow-xl transition-all active:scale-95">
              <Plus className="mr-3 h-6 w-6 stroke-[2.5]" /> Input Payroll Baru
            </Button>} />
            <DialogContent className="sm:max-w-[900px] bg-popover border-border rounded-[3rem] p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="p-10 pb-6 bg-accent/5">
                <DialogTitle className="text-4xl font-bold font-serif text-foreground">Kalkulasi Gaji Pegawai</DialogTitle>
                <DialogDescription className="text-lg text-muted-foreground">Data yang disubmit akan melalui persetujuan Manajer, WKB 1, dan Ketua.</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-10 py-4 bg-accent/5 border-b border-border">
                  <TabsList className="grid w-full grid-cols-4 h-14 bg-accent/20 rounded-xl p-1 gap-1">
                    <TabsTrigger value="profile" className="rounded-lg font-bold text-xs uppercase tracking-widest">Profil</TabsTrigger>
                    <TabsTrigger value="earnings" className="rounded-lg font-bold text-xs uppercase tracking-widest">Pendapatan</TabsTrigger>
                    <TabsTrigger value="deductions" className="rounded-lg font-bold text-xs uppercase tracking-widest">Potongan</TabsTrigger>
                    <TabsTrigger value="overtime" className="rounded-lg font-bold text-xs uppercase tracking-widest">Lembur</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-10">
                  <TabsContent value="profile" className="m-0 space-y-8">
                    <div className="grid grid-cols-1 gap-8">
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Pilih Pegawai</Label>
                        <Select onValueChange={(val) => setFormData(p => ({...p, employeeId: val}))}>
                          <SelectTrigger className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold">
                            <SelectValue placeholder="Pilih Pegawai" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeList.map(emp => (
                               <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Nama Bank</Label>
                        <Select>
                          <SelectTrigger className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold">
                            <SelectValue placeholder="Pilih Bank" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bca">BCA</SelectItem>
                            <SelectItem value="mandiri">Mandiri</SelectItem>
                            <SelectItem value="bni">BNI</SelectItem>
                            <SelectItem value="bri">BRI</SelectItem>
                            <SelectItem value="bsi">BSI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Nomor Rekening</Label>
                        <Input placeholder="0000000000" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="earnings" className="m-0 grid grid-cols-2 gap-8">
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Gaji Pokok</Label>
                      <Input value={formData.basicSalary} onChange={(e) => handleInputChange('basicSalary', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Uang Makan</Label>
                      <Input value={formData.mealAllowance} onChange={(e) => handleInputChange('mealAllowance', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Tunjangan Posisi</Label>
                      <Input value={formData.positionAllowance} onChange={(e) => handleInputChange('positionAllowance', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Tunjangan Kompetensi</Label>
                      <Input value={formData.competencyAllowance} onChange={(e) => handleInputChange('competencyAllowance', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Tunjangan Pulsa</Label>
                      <Input value={formData.phoneAllowance} onChange={(e) => handleInputChange('phoneAllowance', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Premi</Label>
                      <Input value={formData.premi} onChange={(e) => handleInputChange('premi', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                  </TabsContent>

                  <TabsContent value="deductions" className="m-0 grid grid-cols-2 gap-8">
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Simpan Pinjam Koperasi</Label>
                      <Input value={formData.coopLoan} onChange={(e) => handleInputChange('coopLoan', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Potongan Belanja Toko</Label>
                      <Input value={formData.shopDeduction} onChange={(e) => handleInputChange('shopDeduction', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">BPJS Jamsostek (TK)</Label>
                      <Input value={formData.jamsostek} onChange={(e) => handleInputChange('jamsostek', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">BPJS Kesehatan</Label>
                      <Input value={formData.bpjsHealth} onChange={(e) => handleInputChange('bpjsHealth', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Potongan Lain-lain</Label>
                      <Input value={formData.otherDeduction} onChange={(e) => handleInputChange('otherDeduction', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                  </TabsContent>

                  <TabsContent value="overtime" className="m-0 grid grid-cols-2 gap-8">
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Total Lemburan</Label>
                      <Input value={formData.overtimeAmount} onChange={(e) => handleInputChange('overtimeAmount', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Uang Makan Lembur (Sabtu/Minggu)</Label>
                      <Input value={formData.overtimeMeal} onChange={(e) => handleInputChange('overtimeMeal', e.target.value)} placeholder="0" className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold" />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter className="p-10 pt-6 bg-accent/5 border-t border-border flex flex-row items-center justify-between gap-6">
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Gaji Pokok</p>
                  <p className="text-4xl font-bold text-primary tracking-tighter">{formatCurrency(parseNumber(formData.basicSalary))}</p>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setOpenInput(false)} className="h-16 px-8 text-lg font-bold border-border rounded-2xl">Batal</Button>
                  <Button onClick={handleGenerate} disabled={isSubmitting} className="h-16 px-10 text-lg font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
                    {isSubmitting && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                    Kirim ke Manajer
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="bg-card border-border shadow-xl p-3 rounded-[2rem] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl -mr-8 -mt-8 group-hover:bg-primary/10 transition-all"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Total Payroll {currentMonthLabel.toUpperCase()}</CardTitle>
            <Wallet className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter">{formatCurrency(totalPayrollThisMonth)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-[3rem] border border-border bg-card shadow-2xl overflow-hidden">
        <div className="px-12 py-10 border-b border-border bg-accent/5 flex items-center justify-between">
          <h3 className="text-3xl font-bold font-serif">Riwayat & Status Persetujuan</h3>
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Cari nama pegawai..." className="pl-12 h-12 bg-accent/10 border-border rounded-xl font-bold" />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-accent/10">
            <TableRow className="h-24 border-border">
              <TableHead className="pl-12 text-xs font-bold uppercase tracking-widest">Pegawai</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-center">Jam Kerja</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-center">Potongan (Loan/Telat)</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest text-center">Take Home Pay</TableHead>
              <TableHead className="text-right pr-12 text-xs font-bold uppercase tracking-widest">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                   <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-[10px]">Memuat Data...</p>
                </TableCell>
              </TableRow>
            ) : payrollList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">Belum ada riwayat penggajian.</TableCell>
              </TableRow>
            ) : payrollList.map((item) => (
              <TableRow key={item.id} className="h-32 border-border hover:bg-accent/5 transition-all group">
                <TableCell className="pl-12">
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        {item.employeeName?.[0]}
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-2xl text-foreground">{item.employeeName}</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{item.month}</span>
                     </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                   <div className="flex flex-col items-center">
                      <span className="font-bold text-lg text-foreground">{item.actualWorkHours} / {item.expectedWorkHours}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Hours</span>
                   </div>
                </TableCell>
                <TableCell className="text-center">
                   <div className="flex flex-col items-center">
                      <span className="font-bold text-lg text-destructive">{formatCurrency((item.loanDeduction || 0) + (item.lateDeduction || 0) + (item.leaveDeduction || 0))}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
                        Loan: {formatCurrency(item.loanDeduction)} <br/>
                        Attend: {formatCurrency((item.lateDeduction || 0) + (item.leaveDeduction || 0))}
                      </span>
                   </div>
                </TableCell>
                <TableCell className="text-center">
                   <span className="font-bold text-3xl text-primary tracking-tighter">{formatCurrency(item.netSalary)}</span>
                </TableCell>
                <TableCell className="text-right pr-12">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-border hover:bg-accent transition-all">
                       <Eye className="h-6 w-6" />
                    </Button>
                    <Button 
                      onClick={() => downloadPDFSlip(item)} 
                      variant="ghost" 
                      className="h-14 px-8 font-bold text-lg rounded-2xl hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <FileDown className="h-6 w-6 mr-3" /> Slip
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
