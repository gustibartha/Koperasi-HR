"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Award, Target, MessageSquare, Plus, User, Loader2 } from "lucide-react"
import { addPerformanceEvaluation, getAllPerformances } from "@/app/actions/performance"
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
import { Textarea } from "@/components/ui/textarea"


export default function PerformancePage() {
  const [open, setOpen] = React.useState(false)
  const [isFetching, setIsFetching] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [performanceList, setPerformanceList] = React.useState<any[]>([])
  const [employeeList, setEmployeeList] = React.useState<any[]>([])

  const [formData, setFormData] = React.useState({
    employeeId: "",
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    kpiScore: "",
    evaluationNote: "",
  })

  const fetchPerformances = React.useCallback(async () => {
    setIsFetching(true)
    const res = await getAllPerformances()
    if (res.success) setPerformanceList(res.data || [])
    
    const empRes = await getEmployees()
    if (empRes.success) setEmployeeList(empRes.data || [])
    setIsFetching(false)
  }, [])

  React.useEffect(() => {
    fetchPerformances()
  }, [fetchPerformances])

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.kpiScore || !formData.evaluationNote) {
      alert("Mohon lengkapi semua data penilaian")
      return
    }

    setIsSubmitting(true)
    const res = await addPerformanceEvaluation(
      formData.employeeId,
      formData.month,
      parseInt(formData.kpiScore),
      formData.evaluationNote
    )
    setIsSubmitting(false)

    if (res.success) {
      setOpen(false)
      fetchPerformances()
      setFormData({ employeeId: "", month: new Date().toISOString().slice(0, 7), kpiScore: "", evaluationNote: "" })
    } else {
      alert(res.message)
    }
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Performance (KPI)</h1>
          <p className="text-muted-foreground text-xl font-medium">
            Monitor your monthly performance scores and feedback.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-14 text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
            <Plus className="mr-3 h-6 w-6 stroke-[2.5]" /> Input KPI
          </Button>} />
          <DialogContent className="sm:max-w-[650px] bg-popover border-border rounded-[2.5rem] p-12 shadow-2xl">
            <DialogHeader className="space-y-6">
              <DialogTitle className="text-4xl font-bold tracking-tight font-serif text-foreground">Input KPI Score</DialogTitle>
              <DialogDescription className="text-xl text-muted-foreground">
                Enter performance metrics and feedback for the selected employee.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-10 py-10">
              <div className="grid grid-cols-2 gap-8">
                <div className="grid gap-4">
                  <Label htmlFor="employee" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Employee</Label>
                  <Select onValueChange={(val) => setFormData(p => ({...p, employeeId: val}))}>
                    <SelectTrigger className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus:ring-primary font-bold">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-xl shadow-2xl">
                      {employeeList.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4">
                  <Label htmlFor="period" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Period</Label>
                  <Input type="month" value={formData.month} onChange={(e) => setFormData(p => ({...p, month: e.target.value}))} className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold" />
                </div>
              </div>
              <div className="grid gap-4">
                <Label htmlFor="score" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">KPI Score (0 - 100)</Label>
                <div className="relative">
                  <Input id="score" type="number" value={formData.kpiScore} onChange={(e) => setFormData(p => ({...p, kpiScore: e.target.value}))} placeholder="85" min="0" max="100" className="h-16 text-2xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold pr-20" />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">/ 100</span>
                </div>
              </div>
              <div className="grid gap-4">
                <Label htmlFor="feedback" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Manager Feedback</Label>
                <Textarea id="feedback" value={formData.evaluationNote} onChange={(e) => setFormData(p => ({...p, evaluationNote: e.target.value}))} placeholder="Provide constructive feedback..." className="min-h-[150px] text-xl bg-accent/30 border-border rounded-2xl px-6 py-5 focus-visible:ring-primary font-medium" />
              </div>
            </div>
            <DialogFooter className="pt-6 gap-6">
              <Button variant="outline" onClick={() => setOpen(false)} className="h-16 px-10 text-xl font-bold border-border rounded-2xl hover:bg-accent transition-all">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="h-16 px-12 text-xl font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                {isSubmitting && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                Save Assessment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="bg-card border-border shadow-xl p-3 group relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl -mr-8 -mt-8 group-hover:bg-primary/10 transition-all duration-700"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Skor Bulan Ini</CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-foreground tracking-tighter">85 <span className="text-2xl text-muted-foreground font-medium">/ 100</span></div>
            <p className="text-lg text-emerald-500 font-bold mt-2 tracking-wide">Status: Good</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 group relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-2xl -mr-8 -mt-8 group-hover:bg-secondary/10 transition-all duration-700"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Rata-rata Kuartal</CardTitle>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-foreground tracking-tighter">83.5</div>
            <p className="text-lg text-emerald-500 font-bold mt-2 tracking-wide flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> +2.1 from last Q
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 group relative overflow-hidden rounded-3xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-all duration-700"></div>
          <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground tracking-[0.2em] uppercase">Pencapaian</CardTitle>
            <Award className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-foreground tracking-tighter">2 <span className="text-2xl text-muted-foreground font-medium">Badge</span></div>
            <p className="text-lg text-emerald-500 font-bold mt-2 tracking-wide">Top Performer (Feb)</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden">
        <div className="px-12 py-10 border-b border-border bg-accent/10">
          <h3 className="text-3xl font-bold tracking-tight text-foreground">Riwayat KPI Bulanan</h3>
          <p className="text-xl text-muted-foreground font-medium">Daftar penilaian kinerja bulanan oleh atasan.</p>
        </div>
        <Table>
          <TableHeader className="bg-accent/30">
            <TableRow className="hover:bg-transparent border-border h-24">
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em] pl-12">Bulan</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em]">Skor</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em]">Status</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em]">Evaluator</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em]">Feedback</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em] text-right pr-12">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                   <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                   <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-[10px]">Memuat Data...</p>
                </TableCell>
              </TableRow>
            ) : performanceList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">Belum ada data penilaian.</TableCell>
              </TableRow>
            ) : performanceList.map((item) => (
              <TableRow key={item.id} className="border-border hover:bg-accent/20 transition-colors h-28">
                <TableCell className="font-bold text-foreground text-2xl pl-12">{item.month}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-3xl text-foreground tracking-tighter">{item.kpiScore}</span>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Points</span>
                  </div>
                </TableCell>
                <TableCell>
                   <span className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] border shadow-md ${
                     item.kpiScore >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                   }`}>
                    {item.kpiScore >= 80 ? 'Good' : 'Needs Improvement'}
                  </span>
                </TableCell>
                <TableCell className="text-foreground text-xl font-bold">
                   <div className="flex flex-col">
                      <span className="font-bold">{item.employeeName}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Evaluator: Admin</span>
                   </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xl font-medium max-w-[300px] truncate">{item.evaluationNote}</TableCell>
                <TableCell className="text-right pr-12">
                  <Button variant="ghost" className="h-14 px-8 font-bold text-lg text-muted-foreground hover:text-foreground hover:bg-accent rounded-2xl transition-all shadow-sm">
                    <MessageSquare className="h-6 w-6 mr-3 stroke-[2.5]" /> Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
