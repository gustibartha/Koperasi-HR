"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldCheck, 
  Check, 
  X, 
  Plane, 
  Calendar, 
  Clock, 
  Info,
  Eye,
  UserCheck,
  CheckCircle2,
  Trash2,
  Loader2
} from "lucide-react"
import { getAllSppds, updateSppdStatus } from "@/app/actions/sppd"
import { getAllLeaves, updateLeaveStatus } from "@/app/actions/leave"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


export default function ApprovalCenterPage() {
  const [requests, setRequests] = React.useState<any[]>([])
  const [isFetching, setIsFetching] = React.useState(true)
  const [processingId, setProcessingId] = React.useState<string | null>(null)

  const fetchRequests = React.useCallback(async () => {
    setIsFetching(true)
    const sppdRes = await getAllSppds()
    const leaveRes = await getAllLeaves()
    
    const sppdRequests = (sppdRes.data || []).filter((r: any) => r.status === "menunggu").map((r: any) => ({
      ...r,
      type: "SPPD",
      employee: r.employeeName,
      detail: r.purpose,
      date: `${new Date(r.departureDate).toLocaleDateString()} - ${new Date(r.returnDate).toLocaleDateString()}`,
      amount: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.totalCost || 0),
      workflow: ["Admin", "Manajer", "Wakil Ketua Bidang 1", "Ketua Kowika"],
      currentStage: 0
    }))

    const leaveRequests = (leaveRes.data || []).filter((r: any) => r.status === "menunggu").map((r: any) => ({
      ...r,
      type: "LEAVE",
      employee: r.employeeName,
      detail: r.reason,
      date: `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}`,
      amount: "Pending",
      workflow: ["Manajer / Direktur"],
      currentStage: 0
    }))

    console.log("Approval Center - SPPD:", sppdRequests.length, "LEAVE:", leaveRequests.length)
    setRequests([...sppdRequests, ...leaveRequests])
    setIsFetching(false)
  }, [])

  React.useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async (id: string, type: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    const status = action === 'approve' ? 'disetujui' : 'ditolak'
    
    if (type === "SPPD") {
      await updateSppdStatus(id, status)
    } else {
      await updateLeaveStatus(id, status)
    }
    
    await fetchRequests()
    setProcessingId(null)
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Approval Center</h1>
          <p className="text-muted-foreground text-xl font-medium">Smart workflow logic for Kowika, WKI, and WKS.</p>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" onClick={fetchRequests} className="h-12 px-6 rounded-2xl border-border font-bold">
              Refresh
           </Button>
           <Badge variant="outline" className="h-12 px-6 rounded-2xl border-primary/20 bg-primary/5 text-primary font-bold text-lg">
              {requests.length} PENDING
           </Badge>
        </div>
      </div>

      <div className="grid gap-8">
        {isFetching ? (
             <div className="p-32 flex flex-col items-center justify-center text-center space-y-8">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground text-xl font-bold uppercase tracking-widest">Loading Requests...</p>
             </div>
          ) : requests.length === 0 ? (
            <div className="p-32 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500">
              <div className="h-32 w-32 rounded-[3rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 shadow-2xl shadow-emerald-500/20">
                 <CheckCircle2 className="h-16 w-16" />
              </div>
              <div>
                 <h3 className="text-4xl font-bold font-serif text-foreground">All Requests Processed</h3>
                 <p className="text-muted-foreground text-xl mt-2">You have no pending approvals at the moment.</p>
              </div>
              <Button variant="outline" onClick={fetchRequests} className="h-14 px-8 rounded-2xl font-bold border-border">
                 Refresh Data
              </Button>
            </div>
          ) : requests.map((req) => (
            <Card 
              key={req.id} 
              className={`bg-card border-border hover:border-primary/20 shadow-xl rounded-[2.5rem] overflow-hidden transition-all duration-500 group ${
                processingId === req.id ? "opacity-50 scale-95 pointer-events-none" : "opacity-100 scale-100"
              }`}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-stretch">
                   <div className={`w-2 md:w-4 ${req.type === 'SPPD' ? 'bg-primary' : 'bg-blue-500'}`}></div>
                   
                   <div className="flex-1 p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                     <div className="flex items-center gap-8 flex-1 min-w-0">
                        <div className={`h-20 w-20 rounded-3xl flex items-center justify-center shrink-0 shadow-lg ${
                          req.type === 'SPPD' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {req.type === 'SPPD' ? <Plane className="h-10 w-10" /> : <Calendar className="h-10 w-10" />}
                        </div>
                        
                        <div className="space-y-2 min-w-0">
                           <div className="flex items-center gap-3">
                              <Badge className="bg-accent/30 text-muted-foreground border-none font-bold text-[10px] tracking-widest uppercase rounded-lg px-3">
                                {req.id}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary">
                                {req.org || "KOWIKA"}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-accent/20">
                                {req.position || "Staff"}
                              </Badge>
                           </div>
                           <h3 className="text-3xl font-bold text-foreground leading-tight truncate">{req.employee}</h3>
                           <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                              <span className="font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Waiting for: {req.workflow[req.currentStage]}
                              </span>
                              <span className="text-muted-foreground/60">({req.currentStage + 1} of {req.workflow.length} stages)</span>
                           </div>
                        </div>
                     </div>
 
                     <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto">
                        <Dialog>
                           <DialogTrigger render={<Button variant="outline" className="h-16 flex-1 lg:flex-initial px-8 rounded-2xl border-border hover:bg-accent font-bold text-lg transition-all active:scale-95">
                              <Eye className="h-6 w-6 mr-3" /> Review Workflow
                           </Button>} />
                           <DialogContent className="sm:max-w-[700px] bg-popover border-border rounded-[3rem] p-0 shadow-2xl overflow-hidden">
                              <DialogHeader className="p-10 pb-6 bg-accent/5">
                                 <DialogTitle className="text-3xl font-bold font-serif">Approval Workflow</DialogTitle>
                                 <DialogDescription className="text-lg text-muted-foreground mt-2">
                                   Conditional path for {req.employee} ({req.position || "Staff"})
                                 </DialogDescription>
                              </DialogHeader>
                              
                              <div className="p-10 space-y-10 max-h-[50vh] overflow-y-auto">
                                 <div className="relative flex flex-col gap-8">
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border -z-10"></div>
                                    {req.workflow.map((step: string, idx: number) => (
                                       <div key={idx} className="flex items-center gap-6">
                                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border-2 z-10 ${
                                             idx < req.currentStage ? "bg-emerald-500 border-emerald-500 text-white" :
                                             idx === req.currentStage ? "bg-amber-500 border-amber-500 text-white animate-pulse" :
                                             "bg-card border-border text-muted-foreground"
                                          }`}>
                                             {idx < req.currentStage ? <Check className="h-6 w-6" /> : <UserCheck className="h-6 w-6" />}
                                          </div>
                                          <div className="flex-1 flex items-center justify-between">
                                             <div>
                                                <p className={`font-bold text-xl ${idx === req.currentStage ? "text-amber-500" : "text-foreground"}`}>{step}</p>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                   {idx < req.currentStage ? "Approved" : idx === req.currentStage ? "Waiting Action" : "Next Level"}
                                                </p>
                                             </div>
                                             {idx < req.currentStage && <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold">Verified</Badge>}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
 
                                 <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20">
                                    <div className="flex justify-between items-center mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                                       <span>Request Detail</span>
                                       <span>{req.org || "KOWIKA"}</span>
                                    </div>
                                    <p className="text-lg font-bold">"{req.detail}"</p>
                                    <p className="text-3xl font-bold text-foreground tracking-tighter mt-4">{req.amount}</p>
                                 </div>
                              </div>
 
                              <DialogFooter className="p-10 pt-6 bg-accent/5 border-t border-border flex flex-row gap-4">
                                 <Button 
                                   onClick={() => handleAction(req.id, req.type, 'reject')}
                                   className="flex-1 h-16 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 font-bold text-lg hover:bg-destructive hover:text-white transition-all active:scale-95"
                                 >
                                   Reject
                                 </Button>
                                 <Button 
                                   onClick={() => handleAction(req.id, req.type, 'approve')}
                                   className="flex-1 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-xl shadow-emerald-600/20 hover:opacity-90 active:scale-95"
                                 >
                                   Approve Stage {req.currentStage + 1}
                                 </Button>
                              </DialogFooter>
                           </DialogContent>
                        </Dialog>
                        
                        <div className="flex gap-2">
                           <Button 
                             onClick={() => handleAction(req.id, req.type, 'reject')}
                             className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-lg border border-destructive/20 active:scale-90"
                           >
                              <X className="h-7 w-7 stroke-[3]" />
                           </Button>
                           <Button 
                             onClick={() => handleAction(req.id, req.type, 'approve')}
                             className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg border border-emerald-500/20 active:scale-90"
                           >
                              <Check className="h-7 w-7 stroke-[3]" />
                           </Button>
                        </div>
                     </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
