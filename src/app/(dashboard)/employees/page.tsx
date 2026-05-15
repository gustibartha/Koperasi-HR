"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { MoreHorizontal, Plus, Search, Phone, Mail, Briefcase, GraduationCap, Calendar, Filter, Upload, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { getEmployees, addEmployee, deleteEmployee } from "@/app/actions/employee"
import { toast } from "sonner"
import { useCompany } from "@/context/CompanyContext"


export default function EmployeesPage() {
  const [openAdd, setOpenAdd] = React.useState(false)
  const [openUpload, setOpenUpload] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deptFilter, setDeptFilter] = React.useState("all")
  const [employees, setEmployees] = React.useState<any[]>([])
  const [isFetching, setIsFetching] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { selectedCompany } = useCompany()

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    education: "",
    joiningYear: "",
  })

  const fetchEmployees = React.useCallback(async () => {
    if (!selectedCompany) return
    setIsFetching(true)
    const res = await getEmployees(selectedCompany.id)
    if (res.success) {
      setEmployees(res.data || [])
    }
    setIsFetching(false)
  }, [selectedCompany])

  React.useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.position || !selectedCompany) {
      alert("Mohon isi Nama, Email, dan Jabatan")
      return
    }

    setIsSubmitting(true)
    const res = await addEmployee({ ...formData, companyId: selectedCompany.id })
    setIsSubmitting(false)

    if (res.success) {
      setOpenAdd(false)
      fetchEmployees()
      setFormData({
        name: "", email: "", phone: "", position: "", department: "", education: "", joiningYear: ""
      })
    } else {
      alert(res.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pegawai ini?")) {
      const res = await deleteEmployee(id)
      if (res.success) {
        fetchEmployees()
      } else {
        alert(res.message)
      }
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.id?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = deptFilter === "all" || emp.department === deptFilter
    return matchesSearch && matchesDept
  })

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)))

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Employees</h1>
          <p className="text-muted-foreground text-xl font-medium">
            Manage your employee records and organizational data.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Upload Dialog */}
           <Dialog open={openUpload} onOpenChange={setOpenUpload}>
            <DialogTrigger render={<Button variant="outline" className="border-border hover:bg-accent font-bold px-6 h-14 text-lg rounded-2xl transition-all">
              <Upload className="mr-3 h-5 w-5" /> Import
            </Button>} />
            <DialogContent className="sm:max-w-[600px] bg-popover border-border rounded-[2.5rem] p-10 shadow-2xl">
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-3xl font-bold tracking-tight font-serif">Import Employee Data</DialogTitle>
                <DialogDescription className="text-lg">
                  Upload an Excel file to add multiple employees at once.
                </DialogDescription>
              </DialogHeader>
              <div className="py-10">
                <div className="border-2 border-dashed border-border rounded-[2rem] p-12 flex flex-col items-center gap-6 bg-accent/10 hover:bg-accent/20 transition-all cursor-pointer group">
                   <div className="p-6 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="h-12 w-12 text-primary" />
                   </div>
                   <div className="text-center">
                      <p className="text-xl font-bold text-foreground">Click or Drag File Here</p>
                      <p className="text-muted-foreground">Supported format: .xlsx</p>
                   </div>
                </div>
                <div className="mt-8 p-6 bg-secondary/5 border border-secondary/20 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <Download className="h-6 w-6 text-secondary" />
                      <div>
                         <p className="font-bold text-foreground">Need an Excel template?</p>
                         <p className="text-sm text-muted-foreground">Download our pre-formatted file.</p>
                      </div>
                   </div>
                   <Button variant="secondary" asChild className="font-bold rounded-xl h-12 px-6">
                      <a href="/employee_template.xlsx" download>Download</a>
                   </Button>
                </div>
              </div>
              <DialogFooter className="gap-4">
                <Button variant="outline" onClick={() => setOpenUpload(false)} className="h-14 px-8 font-bold rounded-xl">Cancel</Button>
                <Button className="h-14 px-10 font-bold bg-primary text-primary-foreground rounded-xl shadow-lg">Process Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Employee Dialog */}
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-14 text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
              <Plus className="mr-3 h-6 w-6 stroke-[2.5]" /> Add Employee
            </Button>} />
            <DialogContent className="sm:max-w-[750px] bg-popover border-border rounded-[2.5rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="space-y-4">
                <DialogTitle className="text-4xl font-bold tracking-tight font-serif text-foreground">Add New Employee</DialogTitle>
                <DialogDescription className="text-xl text-muted-foreground">
                  Enter the complete details for the new staff member.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-10 py-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="grid gap-4">
                      <Label htmlFor="name" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Full Name</Label>
                      <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold" required />
                    </div>
                    <div className="grid gap-4">
                      <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Nomor WA</Label>
                      <Input id="phone" value={formData.phone} onChange={handleInputChange} placeholder="0812xxxx" className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="grid gap-4">
                      <Label htmlFor="email" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Email Address</Label>
                      <Input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold" required />
                    </div>
                    <div className="grid gap-4">
                      <Label htmlFor="education" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Pendidikan</Label>
                      <Input id="education" value={formData.education} onChange={handleInputChange} placeholder="S1 / D3" className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <div className="grid gap-4">
                      <Label htmlFor="position" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Jabatan</Label>
                      <Input id="position" value={formData.position} onChange={handleInputChange} placeholder="Position" className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary" required />
                    </div>
                    <div className="grid gap-4">
                      <Label htmlFor="department" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Bagian</Label>
                      <Input id="department" value={formData.department} onChange={handleInputChange} placeholder="Department" className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary" />
                    </div>
                    <div className="grid gap-4">
                      <Label htmlFor="joiningYear" className="text-sm font-bold uppercase tracking-[0.2em] text-primary ml-1">Tahun Masuk</Label>
                      <Input id="joiningYear" value={formData.joiningYear} onChange={handleInputChange} placeholder="2024" className="h-16 text-xl bg-accent/30 border-border rounded-2xl px-6 focus-visible:ring-primary" />
                    </div>
                  </div>
                </div>
                <DialogFooter className="pt-6 gap-6">
                  <Button type="button" variant="outline" onClick={() => setOpenAdd(false)} className="h-16 px-10 text-xl font-bold border-border rounded-2xl hover:bg-accent transition-all">Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="h-16 px-12 text-xl font-bold bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                    {isSubmitting && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                    Save Employee
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full md:max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground stroke-[2.5]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="pl-16 h-20 text-xl bg-card border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary rounded-3xl shadow-sm font-medium"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
             <Filter className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary z-10" />
             <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="h-20 pl-14 text-lg bg-card border-border rounded-3xl font-bold focus:ring-primary">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border rounded-2xl shadow-2xl">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
             </Select>
          </div>
          <div className="text-muted-foreground font-bold text-lg px-4">
             {filteredEmployees.length} Found
          </div>
        </div>
      </div>

      <div className="rounded-[3rem] border border-border bg-card shadow-2xl overflow-hidden">
        <Table>
          <TableHeader className="bg-accent/30">
            <TableRow className="hover:bg-transparent border-border h-24">
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em] pl-12">Employee Details</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em]">Contact</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em]">Job & Dept</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em]">Edu & Year</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em]">Status</TableHead>
              <TableHead className="text-muted-foreground font-bold uppercase text-sm tracking-[0.2em] text-right pr-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-2xl font-bold text-muted-foreground">Loading employees...</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="border-border hover:bg-accent/20 transition-colors h-32">
                  <TableCell className="pl-12">
                     <div className="flex flex-col gap-1">
                        <span className="font-bold text-foreground text-2xl tracking-tight">{employee.name}</span>
                        <span className="text-xs text-muted-foreground font-bold tracking-[0.2em] uppercase">{employee.id}</span>
                     </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-lg text-muted-foreground font-bold">
                         <Mail className="h-5 w-5 text-primary" /> {employee.email}
                      </div>
                      <div className="flex items-center gap-3 text-lg text-muted-foreground font-bold">
                         <Phone className="h-5 w-5 text-primary" /> {employee.phone || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-lg text-foreground font-bold">
                         <Briefcase className="h-5 w-5 text-secondary" /> {employee.position}
                      </div>
                      <span className="text-sm text-muted-foreground font-bold uppercase tracking-widest">{employee.department || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 text-lg text-foreground font-bold">
                         <GraduationCap className="h-5 w-5 text-emerald-500" /> {employee.education || "-"}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold">
                         <Calendar className="h-4 w-4" /> Masuk: {employee.joiningYear || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] border shadow-md bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      {employee.role === "admin" ? "Admin" : "Karyawan"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-12">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-14 w-14 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-2xl transition-all shadow-sm">
                        <MoreHorizontal className="h-8 w-8 stroke-[2.5]" />
                      </Button>} />
                      <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground rounded-[2rem] shadow-3xl p-3 min-w-64 border">
                        <DropdownMenuLabel className="px-6 py-4 font-bold text-lg tracking-tight">Employee Actions</DropdownMenuLabel>
                        <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground py-5 px-6 rounded-2xl cursor-pointer font-bold text-lg transition-all">Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground py-5 px-6 rounded-2xl cursor-pointer font-bold text-lg transition-all">View Full Record</DropdownMenuItem>
                        <DropdownMenuSeparator className="my-3" />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(employee.id)}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive py-5 px-6 rounded-2xl cursor-pointer font-bold text-lg transition-all"
                        >
                          Delete Employee
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-4">
                      <Search className="h-12 w-12 text-muted-foreground/30" />
                      <p className="text-2xl font-bold text-muted-foreground">No employees found matching your criteria.</p>
                   </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
