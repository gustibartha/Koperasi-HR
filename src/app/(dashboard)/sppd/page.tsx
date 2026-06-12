"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plane, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Wallet, 
  Clock, 
  FileDown, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  Train,
  Car,
  Hotel,
  Utensils,
  Loader2,
  Printer,
  XCircle,
  Edit2,
  Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { requestSppd, getAllSppds } from "@/app/actions/sppd"
import { getEmployees } from "@/app/actions/employee"
import { toast } from "sonner" // Assuming sonner is available for notifications
import { useCompany } from "@/context/CompanyContext"

const DUMMY_EMPLOYEE_ID = "2bb7db5b-c648-44c2-8acf-46ab40cb009d"

const airports = [
  { region: "Sumatera & Kepulauan", items: [
    "Sultan Iskandar Muda (Aceh Besar)", "Kualanamu (Deli Serdang)", "Raja Sisingamangaraja XII (Tapanuli Utara)", 
    "Minangkabau (Padang Pariaman)", "Sultan Syarif Kasim II (Pekanbaru)", "Raja Haji Fisabilillah (Tanjung Pinang)", 
    "Hang Nadim (Batam)", "S.M. Badaruddin II (Palembang)", "Radin Inten II (Lampung Selatan)", "H.A.S. Hanandjoeddin (Belitung)"
  ]},
  { region: "Jawa", items: [
    "Soekarno-Hatta (Tangerang)", "Halim Perdanakusuma (Jakarta)", "Kertajati (Majalengka)", "Husein Sastranegara (Bandung)", 
    "Jenderal Ahmad Yani (Semarang)", "Adi Soemarmo (Boyolali)", "Yogyakarta International Airport (Kulon Progo)", 
    "Juanda (Sidoarjo/Surabaya)", "Abdulrachman Saleh (Malang)", "Banyuwangi"
  ]},
  { region: "Kalimantan, Sulawesi, NTT, Bali, Papua", items: [
    "Supadio (Pontianak)", "Syamsudin Noor (Banjarbaru)", "SAMS Sepinggan (Balikpapan)", "Juwata (Tarakan)", 
    "Sultan Hasanuddin (Maros/Makassar)", "Sam Ratulangi (Manado)", "Ngurah Rai (Badung/Denpasar)", 
    "Komodo (Labuan Bajo/Manggarai Barat)", "Sentani (Jayapura)"
  ]}
]

// Helper to format number with dots
const formatNumber = (val: string) => {
  if (!val) return ""
  const num = val.replace(/\D/g, "")
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export default function SPPDPage() {
  const [open, setOpen] = React.useState(false)
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const [sppdList, setSppdList] = React.useState<any[]>([])
  const [employeeList, setEmployeeList] = React.useState<any[]>([])
  const [selectedSppd, setSelectedSppd] = React.useState<any>(null)
  const [openViewDetail, setOpenViewDetail] = React.useState(false)
  const { selectedCompany } = useCompany()

  const [formData, setFormData] = React.useState({
    employeeId: "",
    origin: "Soekarno-Hatta (Tangerang)",
    destination: "",
    purpose: "",
    departureDate: "",
    returnDate: "",
  })

  const [budgets, setBudgets] = React.useState({
    daily: "",
    transport: "",
    hotel: "",
    other: ""
  })

  const fetchSppd = React.useCallback(async () => {
    if (!selectedCompany) return
    setIsFetching(true)
    const res = await getAllSppds(selectedCompany.id)
    if (res.success) {
      setSppdList(res.data || [])
    }
    const empRes = await getEmployees(selectedCompany.id)
    if (empRes.success) {
      setEmployeeList(empRes.data || [])
    }
    setIsFetching(false)
  }, [selectedCompany])

  React.useEffect(() => {
    fetchSppd()
  }, [fetchSppd])

  const handleBudgetChange = (key: keyof typeof budgets, value: string) => {
    setBudgets(prev => ({ ...prev, [key]: formatNumber(value) }))
  }

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const calculateTotalBudget = () => {
    const daily = parseInt(budgets.daily.replace(/\./g, "")) || 0
    const transport = parseInt(budgets.transport.replace(/\./g, "")) || 0
    const hotel = parseInt(budgets.hotel.replace(/\./g, "")) || 0
    const other = parseInt(budgets.other.replace(/\./g, "")) || 0
    return daily + transport + hotel + other
  }

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.origin || !formData.destination || !formData.departureDate || !formData.returnDate || !formData.purpose) {
      alert("Mohon lengkapi semua data perjalanan")
      return
    }

    setIsSubmitting(true)
    const totalCost = calculateTotalBudget()
    
    const res = await requestSppd(
      formData.employeeId,
      formData.origin,
      formData.destination,
      new Date(formData.departureDate),
      new Date(formData.returnDate),
      formData.purpose,
      totalCost,
      {
        daily: parseInt(budgets.daily.replace(/\./g, "")) || 0,
        transport: parseInt(budgets.transport.replace(/\./g, "")) || 0,
        hotel: parseInt(budgets.hotel.replace(/\./g, "")) || 0,
        other: parseInt(budgets.other.replace(/\./g, "")) || 0
      },
      selectedCompany.id
    )

    setIsSubmitting(false)
    if (res.success) {
      setOpen(false)
      fetchSppd()
      // Reset form
      setFormData({ employeeId: "", origin: "Soekarno-Hatta (Tangerang)", destination: "", purpose: "", departureDate: "", returnDate: "" })
      setBudgets({ daily: "", transport: "", hotel: "", other: "" })
    } else {
      alert("Gagal mengajukan SPPD: " + res.message)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleViewDetail = (sppd: any) => {
    setSelectedSppd(sppd)
    setOpenViewDetail(true)
  }

  const handleDownload = (sppd: any) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const budget = sppd.totalCost || 0
      printWindow.document.write(`
        <html>
          <head>
            <title>Slip SPPD - ${sppd.id}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; color: #333; line-height: 1.6; }
              .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 26px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
              .subtitle { font-size: 18px; font-weight: bold; color: #444; }
              
              .info-section { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .info-box { border: 1px solid #ddd; padding: 15px; rounded: 8px; }
              .info-label { font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 5px; }
              .info-value { font-size: 16px; font-weight: bold; }

              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f8f9fa; border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
              td { border: 1px solid #ddd; padding: 12px; font-size: 14px; }
              .total-row { background-color: #f1f3f5; font-weight: bold; font-size: 18px; }
              .text-right { text-align: right; }

              .footer { margin-top: 60px; display: flex; justify-content: space-between; }
              .signature-box { text-align: center; width: 200px; }
              .signature-space { height: 80px; }
              .signature-name { font-weight: bold; text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${selectedCompany?.name || "KOWIKA"}</div>
              <div class="subtitle">SURAT PERINTAH PERJALANAN DINAS (SPPD)</div>
            </div>

            <div class="info-section">
               <div class="info-box">
                  <div class="info-label">Nama Pegawai</div>
                  <div class="info-value">${sppd.employeeName || "Unknown"}</div>
               </div>
               <div class="info-box">
                  <div class="info-label">ID Pengajuan</div>
                  <div class="info-value">${sppd.id}</div>
               </div>
               <div class="info-box">
                  <div class="info-label">Rute Perjalanan</div>
                  <div class="info-value">${sppd.origin} &rarr; ${sppd.destination}</div>
               </div>
               <div class="info-box">
                  <div class="info-label">Periode</div>
                  <div class="info-value">${new Date(sppd.departureDate).toLocaleDateString()} s/d ${new Date(sppd.returnDate).toLocaleDateString()}</div>
               </div>
            </div>

            <div style="margin-bottom: 10px; font-weight: bold; text-transform: uppercase; font-size: 14px;">Rincian Estimasi Biaya:</div>
            <table>
              <thead>
                <tr>
                  <th>Komponen Biaya</th>
                  <th class="text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Uang Harian / Makan</td>
                  <td class="text-right">${formatCurrency(sppd.dailyAllowance || 0)}</td>
                </tr>
                <tr>
                  <td>Transportasi (Tiket/BBM)</td>
                  <td class="text-right">${formatCurrency(sppd.transportCost || 0)}</td>
                </tr>
                <tr>
                  <td>Penginapan / Hotel</td>
                  <td class="text-right">${formatCurrency(sppd.hotelCost || 0)}</td>
                </tr>
                <tr>
                  <td>Biaya Lain-lain</td>
                  <td class="text-right">${formatCurrency(sppd.otherCost || 0)}</td>
                </tr>
                <tr class="total-row">
                  <td>TOTAL ESTIMASI ANGGARAN</td>
                  <td class="text-right">${formatCurrency(budget)}</td>
                </tr>
              </tbody>
            </table>

            <div style="margin-top: 30px; font-style: italic; font-size: 12px; color: #666;">
               *Maksud Perjalanan: ${sppd.purpose}
            </div>

            <div class="footer">
               <div></div>
               <div class="signature-box">
                  <p>Mengetahui,</p>
                  <p>Jakarta, ${new Date().toLocaleDateString('id-ID')}</p>
                  <div class="signature-space"></div>
                  <p class="signature-name">(....................................)</p>
                  <p>Manajer / Direktur</p>
               </div>
            </div>

            <script>
              window.onload = function() { 
                window.print(); 
                setTimeout(() => { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">SPPD Management</h1>
          <p className="text-muted-foreground text-xl font-medium">Surat Perintah Perjalanan Dinas & Expense Tracking.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-14 text-lg rounded-2xl shadow-xl transition-all active:scale-95">
            <Plus className="mr-3 h-6 w-6 stroke-[2.5]" /> Buat SPPD Baru
          </Button>} />
          <DialogContent className="sm:max-w-[900px] bg-popover border-border rounded-[3rem] p-0 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <DialogHeader className="p-10 pb-6 bg-accent/5">
              <DialogTitle className="text-4xl font-bold font-serif">Pengajuan SPPD</DialogTitle>
              <DialogDescription className="text-lg text-muted-foreground mt-2">Lengkapi rincian perjalanan dinas pegawai kowika.</DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-10 pt-0 space-y-10">
              {/* Rute & Tujuan */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary">
                   <MapPin className="h-5 w-5" />
                   <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Data Pegawai & Rute</h3>
                </div>
                <div className="grid gap-3 mb-4">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Pilih Pegawai</Label>
                  <Select onValueChange={(val) => handleFormChange("employeeId", val)}>
                    <SelectTrigger className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold">
                      <SelectValue placeholder="Pilih Pegawai" />
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false} className="w-auto min-w-[340px] max-w-[95vw]">
                      {employeeList.map(emp => (
                        <SelectItem key={emp.id} value={emp.id} className="pr-10">{emp.name} - {emp.position}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-11 items-end gap-4">
                  <div className="col-span-5 grid gap-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Bandara Asal</Label>
                    <Select value={formData.origin} onValueChange={(val) => handleFormChange("origin", val)}>
                      <SelectTrigger className="h-16 text-xs bg-accent/10 border-border rounded-2xl px-6 font-bold whitespace-normal text-left leading-tight">
                        <SelectValue placeholder="Pilih Bandara Asal" />
                      </SelectTrigger>
                      <SelectContent align="start" alignItemWithTrigger={false} className="w-auto min-w-[340px] max-w-[95vw]">
                        {airports.map(region => (
                          <SelectGroup key={region.region}>
                            <SelectLabel className="px-4 py-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-accent/5">{region.region}</SelectLabel>
                            {region.items.map(airport => (
                              <SelectItem key={airport} value={airport} className="text-sm py-3 pr-10">{airport}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex justify-center pb-5">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <div className="col-span-5 grid gap-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Bandara Tujuan</Label>
                    <Select value={formData.destination} onValueChange={(val) => handleFormChange("destination", val)}>
                      <SelectTrigger className="h-16 text-xs bg-accent/10 border-border rounded-2xl px-6 font-bold whitespace-normal text-left leading-tight">
                        <SelectValue placeholder="Pilih Bandara Tujuan" />
                      </SelectTrigger>
                      <SelectContent align="start" alignItemWithTrigger={false} className="w-auto min-w-[340px] max-w-[95vw]">
                        {airports.map(region => (
                          <SelectGroup key={region.region}>
                            <SelectLabel className="px-4 py-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-accent/5">{region.region}</SelectLabel>
                            {region.items.map(airport => (
                              <SelectItem key={airport} value={airport} className="text-sm py-3 pr-10">{airport}</SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Maksud & Tujuan Perjalanan</Label>
                  <Textarea 
                    placeholder="Jelaskan keperluan dinas secara detail..." 
                    className="min-h-[100px] text-lg bg-accent/10 border-border rounded-2xl p-6 font-medium" 
                    value={formData.purpose}
                    onChange={(e) => handleFormChange("purpose", e.target.value)}
                  />
                </div>
              </div>

              {/* Waktu Perjalanan */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary">
                   <Calendar className="h-5 w-5" />
                   <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Waktu Perjalanan</h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tanggal Berangkat</Label>
                      <Input 
                        type="date" 
                        className="h-16 text-lg bg-accent/10 border-border rounded-2xl px-6 font-bold" 
                        value={formData.departureDate}
                        onChange={(e) => handleFormChange("departureDate", e.target.value)}
                      />
                   </div>
                   <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tanggal Kembali</Label>
                      <Input 
                        type="date" 
                        className="h-16 text-lg bg-accent/10 border-border rounded-2xl px-6 font-bold" 
                        value={formData.returnDate}
                        onChange={(e) => handleFormChange("returnDate", e.target.value)}
                      />
                   </div>
                </div>
              </div>

              {/* Breakdown Anggaran */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-primary">
                   <Wallet className="h-5 w-5" />
                   <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Estimasi Anggaran (Breakdown)</h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                        <Utensils className="h-3 w-3" /> Uang Harian / Makan
                      </Label>
                      <Input 
                        value={budgets.daily} 
                        onChange={(e) => handleBudgetChange('daily', e.target.value)}
                        placeholder="0" 
                        className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold focus:bg-accent/20 transition-all" 
                      />
                   </div>
                   <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                        <Car className="h-3 w-3" /> Transportasi (Tiket/BBM)
                      </Label>
                      <Input 
                        value={budgets.transport} 
                        onChange={(e) => handleBudgetChange('transport', e.target.value)}
                        placeholder="0" 
                        className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold focus:bg-accent/20 transition-all" 
                      />
                   </div>
                   <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                        <Hotel className="h-3 w-3" /> Penginapan / Hotel
                      </Label>
                      <Input 
                        value={budgets.hotel} 
                        onChange={(e) => handleBudgetChange('hotel', e.target.value)}
                        placeholder="0" 
                        className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold focus:bg-accent/20 transition-all" 
                      />
                   </div>
                   <div className="grid gap-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                        <Plus className="h-3 w-3" /> Biaya Lain-lain / Representasi
                      </Label>
                      <Input 
                        value={budgets.other} 
                        onChange={(e) => handleBudgetChange('other', e.target.value)}
                        placeholder="0" 
                        className="h-16 text-xl bg-accent/10 border-border rounded-2xl px-6 font-bold focus:bg-accent/20 transition-all" 
                      />
                   </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-10 bg-accent/5 border-t border-border flex flex-row items-center justify-between gap-6">
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Estimasi Anggaran</p>
                <p className="text-4xl font-bold text-primary tracking-tighter font-mono">{formatCurrency(calculateTotalBudget())}</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-16 px-10 text-lg font-bold border-border rounded-2xl transition-all active:scale-95">Batal</Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="h-16 px-12 text-lg font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : null}
                  Ajukan Sekarang
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="bg-card border-border shadow-xl p-3 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl -mr-8 -mt-8 group-hover:bg-primary/10 transition-all"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Total Perjalanan</CardTitle>
            <Plane className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter">{sppdList.length}</div>
            <p className="text-xs text-muted-foreground mt-2 font-bold uppercase tracking-widest">Database Record</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl -mr-8 -mt-8 group-hover:bg-amber-500/10 transition-all"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Menunggu Persetujuan</CardTitle>
            <Clock className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter text-amber-500">
              {sppdList.filter(s => s.status === "menunggu").length.toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-bold uppercase tracking-widest">Butuh Konfirmasi</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-all"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Total Anggaran SPPD</CardTitle>
            <Wallet className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold tracking-tighter">
              {formatCurrency(sppdList.reduce((acc, curr) => acc + (curr.totalCost || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-bold uppercase tracking-widest">Semua Periode</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden">
        <div className="px-12 py-10 border-b border-border bg-accent/5 flex items-center justify-between">
           <div>
              <h3 className="text-3xl font-bold font-serif">Riwayat SPPD</h3>
              <p className="text-muted-foreground font-medium mt-1">Daftar perjalanan dinas pegawai kowika.</p>
           </div>
           <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Cari tujuan atau nama..." className="pl-12 h-12 bg-accent/10 border-border rounded-xl font-medium" />
           </div>
        </div>
        <Table>
          <TableHeader className="bg-accent/10">
            <TableRow className="h-20 border-border">
              <TableHead className="pl-12 text-xs font-bold uppercase tracking-widest">Pegawai & Rute</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest">Waktu Perjalanan</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest">Anggaran</TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-widest">Status</TableHead>
              <TableHead className="text-right pr-12 text-xs font-bold uppercase tracking-widest">Aksi</TableHead>
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
            ) : sppdList.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="h-40 text-center">
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Belum ada data SPPD.</p>
                 </TableCell>
               </TableRow>
            ) : sppdList.map((sppd) => (
              <TableRow key={sppd.id} className="h-32 border-border hover:bg-accent/5 transition-all group">
                <TableCell className="pl-12 py-4">
                   <div className="flex items-start gap-5">
                      <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                         <Plane className="h-7 w-7" />
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="font-bold text-lg text-foreground leading-tight">{sppd.employeeName || "Unknown"}</span>
                        <div className="flex items-start gap-2 text-sm font-medium text-muted-foreground max-w-[280px]">
                           <span className="leading-snug break-words">{sppd.origin}</span>
                           <ArrowRight className="h-4 w-4 text-primary/60 shrink-0 mt-0.5" />
                           <span className="leading-snug break-words text-foreground">{sppd.destination}</span>
                        </div>
                      </div>
                   </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-foreground font-bold">
                         <Calendar className="h-4 w-4 text-primary" />
                         <span>{new Date(sppd.departureDate).toLocaleDateString()} - {new Date(sppd.returnDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate max-w-[200px] italic">"{sppd.purpose}"</p>
                   </div>
                </TableCell>
                <TableCell>
                   <span className="text-2xl font-bold tracking-tighter text-foreground">{formatCurrency(sppd.totalCost || 0)}</span>
                </TableCell>
                <TableCell>
                   <Badge className={`px-4 py-2 rounded-xl font-bold text-[10px] tracking-widest uppercase border shadow-none ${
                      sppd.status === "disetujui" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                      sppd.status === "selesai" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      "bg-amber-500/10 text-amber-500 border-amber-500/20"
                   }`}>
                      {sppd.status === "disetujui" && <CheckCircle2 className="h-3 w-3 mr-2" />}
                      {sppd.status === "menunggu" && <AlertCircle className="h-3 w-3 mr-2 animate-pulse" />}
                      {sppd.status}
                   </Badge>
                </TableCell>
                <TableCell className="text-right pr-12">
                   <div className="flex items-center justify-end gap-3">
                      <Button 
                        variant="ghost" 
                        disabled={downloadingId === sppd.id}
                        onClick={() => handleDownload(sppd)}
                        className="h-14 px-6 font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                      >
                         {downloadingId === sppd.id ? (
                           <Loader2 className="h-6 w-6 animate-spin" />
                         ) : (
                           <>
                             <FileDown className="h-6 w-6 mr-2" /> Slip
                           </>
                         )}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-border hover:bg-accent transition-all active:scale-90">
                           <MoreVertical className="h-6 w-6" />
                        </Button>} />
                        <DropdownMenuContent align="end" className="w-56 bg-popover border-border rounded-2xl p-2 shadow-2xl">
                          <DropdownMenuLabel className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Opsi SPPD</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem
                            onClick={() => handleViewDetail(sppd)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer transition-all"
                          >
                            <Eye className="h-5 w-5" /> <span className="font-bold">Lihat Detail</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer transition-all">
                            <Edit2 className="h-5 w-5" /> <span className="font-bold">Ubah Data</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDownload(sppd)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer transition-all"
                          >
                            <Printer className="h-5 w-5" /> <span className="font-bold">Cetak Surat Tugas</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem className="flex items-center gap-3 px-4 py-3 rounded-xl focus:bg-destructive/10 focus:text-destructive cursor-pointer transition-all">
                            <XCircle className="h-5 w-5" /> <span className="font-bold">Batalkan SPPD</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* SPPD Detail View Dialog */}
      <Dialog open={openViewDetail} onOpenChange={setOpenViewDetail}>
        <DialogContent className="sm:max-w-[900px] bg-popover border-border rounded-[2.5rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-10 pb-6 bg-accent/5 border-b border-border">
            <DialogTitle className="text-3xl font-bold font-serif">Detail SPPD</DialogTitle>
            {selectedSppd && <DialogDescription className="text-lg mt-2">{selectedSppd.employeeName} - {new Date(selectedSppd.startDate).toLocaleDateString('id-ID')}</DialogDescription>}
          </DialogHeader>

          <div className="overflow-y-auto flex-1 p-10 space-y-8">
            {selectedSppd && (
              <>
                {/* Header */}
                <div className="text-center border-b-2 border-border pb-6">
                  <h2 className="text-2xl font-bold">{selectedCompany?.name}</h2>
                  <h3 className="text-xl font-bold mt-4">SURAT PERINTAH PERJALANAN DINAS</h3>
                </div>

                {/* Employee & Request ID */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Nama Pegawai</p>
                    <p className="text-lg font-bold">{selectedSppd.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">ID Pengajuan</p>
                    <p className="text-lg font-bold font-mono">{selectedSppd.id?.slice(0, 12)}...</p>
                  </div>
                </div>

                {/* Travel Route & Dates */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3 border-l-4 border-primary pl-4">
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Bandara Asal</p>
                      <p className="text-lg font-bold">{selectedSppd.originAirport}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Bandara Tujuan</p>
                      <p className="text-lg font-bold">{selectedSppd.destinationAirport}</p>
                    </div>
                  </div>
                  <div className="space-y-3 border-l-4 border-secondary pl-4">
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Tanggal Berangkat</p>
                      <p className="text-lg font-bold">{new Date(selectedSppd.startDate).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1">Tanggal Kembali</p>
                      <p className="text-lg font-bold">{new Date(selectedSppd.endDate).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-2">Tujuan Perjalanan</p>
                  <div className="p-4 bg-accent/5 rounded-xl border-l-4 border-primary">
                    <p className="text-base leading-relaxed">{selectedSppd.reason}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Status Approval:</p>
                  <Badge
                    className={`px-4 py-2 text-base font-bold ${
                      selectedSppd.status === 'disetujui'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        : selectedSppd.status === 'ditolak'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                    }`}
                  >
                    {selectedSppd.status === 'disetujui' && '✓ DISETUJUI'}
                    {selectedSppd.status === 'ditolak' && '✗ DITOLAK'}
                    {selectedSppd.status === 'menunggu' && '⏳ MENUNGGU'}
                  </Badge>
                </div>

                {/* Cost Breakdown */}
                <div>
                  <h4 className="text-lg font-bold mb-4">Rincian Estimasi Biaya</h4>
                  <div className="space-y-3">
                    {[
                      { label: "Biaya Transportasi", value: selectedSppd.transportCost, icon: "✈️" },
                      { label: "Biaya Akomodasi (Hotel)", value: selectedSppd.hotelCost, icon: "🏨" },
                      { label: "Uang Harian (Daily Allowance)", value: selectedSppd.dailyAllowance, icon: "💵" },
                      { label: "Biaya Lainnya", value: selectedSppd.otherCost, icon: "📋" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-accent/5 rounded-lg border-l-4 border-primary">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <span className="font-bold text-primary">
                          Rp {item.value?.toLocaleString('id-ID') || '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Cost */}
                <div className="p-6 bg-gradient-to-r from-primary to-primary/80 rounded-2xl text-white">
                  <p className="text-sm uppercase font-bold opacity-90 mb-2">Total Biaya SPPD</p>
                  <p className="text-4xl font-bold tracking-tighter">Rp {selectedSppd.totalCost?.toLocaleString('id-ID')}</p>
                </div>

                {/* Durasi */}
                <div className="p-4 bg-accent/5 rounded-xl border-l-4 border-secondary">
                  <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-2">Durasi Perjalanan</p>
                  <p className="text-2xl font-bold">
                    {Math.ceil((new Date(selectedSppd.endDate).getTime() - new Date(selectedSppd.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} hari
                  </p>
                </div>

                <p className="text-xs text-center text-muted-foreground pt-4">
                  Dibuat pada {new Date(selectedSppd.createdAt).toLocaleString('id-ID')}
                </p>
              </>
            )}
          </div>

          <DialogFooter className="p-6 border-t border-border bg-accent/5">
            <Button
              onClick={() => handleDownload(selectedSppd)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 rounded-xl"
            >
              <Printer className="h-5 w-5 mr-2" /> Cetak Surat Tugas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
