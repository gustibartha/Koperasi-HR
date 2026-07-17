"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  MapPin, 
  Fingerprint, 
  LogIn, 
  LogOut, 
  AlertCircle, 
  CalendarCheck,
  Search,
  Filter,
  MapPinned,
  Camera,
  X,
  History,
  TrendingDown,
  Loader2
} from "lucide-react"
import { clockIn, clockOut, getAllAttendances } from "@/app/actions/attendance"
import { getEmployees } from "@/app/actions/employee"
import { useCompany } from "@/context/CompanyContext"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// VALID ATTENDANCE LOCATIONS - clock-in is allowed within the radius of ANY point.
// Each point has its own radius (meters).
const OFFICE_LOCATIONS = [
  { name: "PT Wira Karya Sinergi", lat: -6.1116535, lng: 106.7882926, radius: 100 },
  { name: "Titik Absen Tambahan", lat: -6.1113735, lng: 106.7825969, radius: 150 },
  { name: "Titik Absen Tambahan 2", lat: -6.1090199, lng: 106.7754303, radius: 100 },
];

// Operational shift start (07:30). Clock-ins after this are counted as late.
const SHIFT_START_HOUR = 7;
const SHIFT_START_MINUTE = 30;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

// Returns how many minutes after shift start the clock-in happened (0 if on time)
const lateMinutesFor = (clockIn: Date) => {
  const shift = new Date(clockIn)
  shift.setHours(SHIFT_START_HOUR, SHIFT_START_MINUTE, 0, 0)
  const diffMs = clockIn.getTime() - shift.getTime()
  return diffMs > 0 ? Math.round(diffMs / 60000) : 0
}

export default function AttendancePage() {
  const { selectedCompany } = useCompany()
  const [time, setTime] = React.useState(new Date())
  const [status, setStatus] = React.useState<"out" | "in">("out")
  const [locationStatus, setLocationStatus] = React.useState<"checking" | "inside" | "outside" | "error">("checking")
  const [distance, setDistance] = React.useState<number | null>(null)
  const [showCamera, setShowCamera] = React.useState(false)
  const [capturedPhoto, setCapturedPhoto] = React.useState<string | null>(null)
  const [attendanceList, setAttendanceList] = React.useState<any[]>([])
  const [employeeList, setEmployeeList] = React.useState<any[]>([])
  const [activeEmployeeId, setActiveEmployeeId] = React.useState<string | null>(null)
  const [isFetching, setIsFetching] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [currentAttendanceId, setCurrentAttendanceId] = React.useState<string | null>(null)
  const [showArea, setShowArea] = React.useState(false)
  const [viewPhoto, setViewPhoto] = React.useState<{ name: string; time: string; photo: string | null } | null>(null)

  // Attendance log is shown one day at a time; default to today, filterable to past days.
  const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  const [filterDate, setFilterDate] = React.useState(() => toDateStr(new Date()))
  const isToday = filterDate === toDateStr(new Date())

  // Logged-in identity. Regular employees are locked to clock in as themselves;
  // admins may pick any employee (shared/kiosk use).
  const [userRole, setUserRole] = React.useState<string>("user")
  const [loginEmployeeId, setLoginEmployeeId] = React.useState<string | null>(null)
  React.useEffect(() => {
    setUserRole(localStorage.getItem("userRole") || "user")
    setLoginEmployeeId(localStorage.getItem("employeeId"))
  }, [])
  const isAdminUser = userRole === "admin" || userRole === "superadmin"

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  // The valid location the user is currently closest to (used when recording GPS).
  const matchedLocationRef = React.useRef(OFFICE_LOCATIONS[0])

  const now = new Date()

  // Derived real metrics
  const todayLogs = attendanceList.filter(l => l.clockIn && isSameDay(new Date(l.clockIn), now))
  const presentTodayCount = new Set(todayLogs.map(l => l.employeeName)).size
  const lateTodayCount = todayLogs.filter(l => lateMinutesFor(new Date(l.clockIn)) > 0).length

  // Logs for the selected day only (the activity table is per-day, filterable).
  const dayLogs = React.useMemo(() => {
    const [y, m, d] = filterDate.split("-").map(Number)
    const ref = new Date(y, (m || 1) - 1, d || 1)
    return attendanceList.filter(l => l.clockIn && isSameDay(new Date(l.clockIn), ref))
  }, [attendanceList, filterDate])

  // Real weekly late recap for the last 7 days
  const weeklyLateRecap = React.useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const recap: { day: string; date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart)
      dayStart.setDate(dayStart.getDate() - i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      const count = attendanceList.filter(l => {
        if (!l.clockIn) return false
        const ci = new Date(l.clockIn)
        return ci >= dayStart && ci < dayEnd && lateMinutesFor(ci) > 0
      }).length
      recap.push({
        day: dayNames[dayStart.getDay()],
        date: dayStart.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        count,
      })
    }
    return recap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendanceList])

  const maxLate = Math.max(1, ...weeklyLateRecap.map(d => d.count))

  const fetchAttendances = React.useCallback(async () => {
    if (!selectedCompany) return
    setIsFetching(true)
    const res = await getAllAttendances(selectedCompany.id)
    if (res.success) {
      setAttendanceList(res.data || [])
    }

    const empRes = await getEmployees(selectedCompany.id)
    const emps = empRes.success && empRes.data ? empRes.data : []
    setEmployeeList(emps)

    // Default the clock-in subject to the logged-in user (matched by name),
    // otherwise leave it empty so the person must pick who they are.
    setActiveEmployeeId(prev => {
      // A logged-in employee is always locked to their own record.
      const storedEmpId = localStorage.getItem("employeeId")
      if (storedEmpId && emps.some((e: any) => e.id === storedEmpId)) return storedEmpId
      if (prev && emps.some((e: any) => e.id === prev)) return prev
      // Otherwise match by name (e.g. director accounts), dropping any "(role)" suffix.
      const norm = (s: string) => (s || "").replace(/\(.*?\)/g, "").trim().toLowerCase()
      const userName = norm(localStorage.getItem("userName") || "")
      const matched = userName ? emps.find((e: any) => norm(e.name) === userName) : null
      return matched?.id ?? null
    })

    setIsFetching(false)
  }, [selectedCompany])

  // Whenever the selected employee or the attendance list changes, detect
  // whether that person already has an open (not-yet-clocked-out) session today.
  React.useEffect(() => {
    if (!activeEmployeeId) {
      setStatus("out")
      setCurrentAttendanceId(null)
      return
    }
    const emp = employeeList.find(e => e.id === activeEmployeeId)
    if (!emp) return
    const openLog = attendanceList.find((l: any) =>
      l.employeeName === emp.name && l.clockIn && isSameDay(new Date(l.clockIn), new Date()) && !l.clockOut
    )
    if (openLog) {
      setStatus("in")
      setCurrentAttendanceId(openLog.id)
    } else {
      setStatus("out")
      setCurrentAttendanceId(null)
    }
  }, [activeEmployeeId, attendanceList, employeeList])

  React.useEffect(() => {
    fetchAttendances()
  }, [fetchAttendances])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const checkLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Evaluate every valid location; inside if within ANY point's radius.
        let nearest = OFFICE_LOCATIONS[0];
        let nearestDistance = Infinity;
        let isInsideAny = false;
        for (const loc of OFFICE_LOCATIONS) {
          const d = calculateDistance(position.coords.latitude, position.coords.longitude, loc.lat, loc.lng);
          if (d < nearestDistance) {
            nearestDistance = d;
            nearest = loc;
          }
          if (d <= loc.radius) isInsideAny = true;
        }
        matchedLocationRef.current = nearest;
        setDistance(Math.round(nearestDistance));
        setLocationStatus(isInsideAny ? "inside" : "outside");
      },
      () => setLocationStatus("error"),
      { enableHighAccuracy: true }
    );
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    checkLocation();
    const locTimer = setInterval(checkLocation, 30000);
    return () => {
      clearInterval(timer);
      clearInterval(locTimer);
    }
  }, [checkLocation])

  const startCamera = async () => {
    setShowCamera(true)
    setCapturedPhoto(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) { console.error(err) }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        // Downscale to keep the stored data URL small (max width 480, JPEG).
        const vw = videoRef.current.videoWidth || 640
        const vh = videoRef.current.videoHeight || 480
        const maxW = 480
        const scale = Math.min(1, maxW / vw)
        canvasRef.current.width = Math.round(vw * scale)
        canvasRef.current.height = Math.round(vh * scale)
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        setCapturedPhoto(canvasRef.current.toDataURL("image/jpeg", 0.7))
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    if (status === "out") {
       // Clock In
       if (!activeEmployeeId) {
          alert("Belum ada pegawai terdaftar pada entitas ini untuk melakukan absensi.")
          setIsSubmitting(false)
          setShowCamera(false)
          return
       }
       const matched = matchedLocationRef.current
       const res = await clockIn(activeEmployeeId, `${matched.lat},${matched.lng}`, true, selectedCompany?.id, capturedPhoto ?? undefined)
       if (res.success) {
          fetchAttendances()
       } else {
          alert(res.message)
       }
    } else if (currentAttendanceId) {
       // Clock Out
       const res = await clockOut(currentAttendanceId)
       if (res.success) {
          fetchAttendances()
       } else {
          alert(res.message)
       }
    }
    setIsSubmitting(false)
    setShowCamera(false)
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">Attendance</h1>
          <p className="text-muted-foreground text-xl font-medium">Real-time presence monitoring & weekly analytics.</p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1">
           <span className="text-sm font-bold uppercase tracking-[0.3em] text-primary">Shift Operasional</span>
           <span className="text-2xl font-bold text-foreground font-mono">07:30 - 16:00</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <Card className="bg-card border-border shadow-xl p-3 rounded-[2.5rem] relative overflow-hidden">
           <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-xl -mr-6 -mt-6"></div>
           <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
             <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Hadir Hari Ini</CardTitle>
             <CalendarCheck className="h-5 w-5 text-emerald-500" />
           </CardHeader>
           <CardContent>
             <div className="text-5xl font-bold text-foreground tracking-tighter">{isFetching ? "…" : presentTodayCount}</div>
           </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 rounded-[2.5rem] relative overflow-hidden border-amber-500/20">
           <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 blur-xl -mr-6 -mt-6"></div>
           <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
             <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Telat Hari Ini</CardTitle>
             <Clock className="h-5 w-5 text-amber-500" />
           </CardHeader>
           <CardContent>
             <div className="text-5xl font-bold text-amber-500 tracking-tighter">{isFetching ? "…" : String(lateTodayCount).padStart(2, "0")}</div>
           </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-xl p-3 rounded-[2.5rem] sm:col-span-2 relative overflow-hidden">
           <CardHeader className="pb-2">
             <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
               <TrendingDown className="h-4 w-4 text-primary" />
               Rekapan Telat 7 Hari Terakhir
             </CardTitle>
           </CardHeader>
           <CardContent className="flex items-end justify-between h-20 gap-2 px-6">
              {weeklyLateRecap.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className="w-full bg-primary/20 rounded-t-lg group-hover:bg-primary transition-all relative"
                    style={{ height: `${Math.max((day.count / maxLate) * 64, 2)}px` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{day.count}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{day.day}</span>
                </div>
              ))}
           </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:gap-12 grid-cols-1 lg:grid-cols-5">
        {/* Clock In/Out Section */}
        <Card className="lg:col-span-2 flex flex-col justify-center items-center p-12 space-y-10 rounded-[3rem] border border-border bg-card shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50"></div>
          <div className="text-center space-y-4 z-10">
            <h2 className="text-7xl font-mono font-bold tracking-tighter text-foreground drop-shadow-2xl">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            <p className="text-xl text-muted-foreground font-bold tracking-widest uppercase">
              {time.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="flex flex-col items-center gap-8 w-full max-w-sm z-10">
            <div className="w-full space-y-2">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Absen sebagai</span>
               {isAdminUser ? (
                  <Select value={activeEmployeeId ?? ""} onValueChange={(val) => setActiveEmployeeId(val)}>
                     <SelectTrigger className="h-14 w-full bg-accent/20 border-border rounded-2xl px-5 font-bold text-base">
                        <SelectValue placeholder="Pilih nama pegawai...">
                           {(value: any) => employeeList.find(e => e.id === value)?.name ?? "Pilih nama pegawai..."}
                        </SelectValue>
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-border bg-popover max-h-[300px]">
                        {employeeList.map(emp => (
                           <SelectItem key={emp.id} value={emp.id} className="font-bold py-3 pr-8">{emp.name}</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               ) : (
                  <div className="h-14 w-full bg-accent/20 border border-border rounded-2xl px-5 flex items-center font-bold text-base">
                     {employeeList.find(e => e.id === activeEmployeeId)?.name
                        || localStorage.getItem("userName")
                        || "—"}
                  </div>
               )}
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
               <div className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all ${
                  locationStatus === "inside" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-destructive/10 border-destructive/30"
               }`}>
                  {locationStatus === "inside" ? <MapPin className="h-6 w-6 text-emerald-500" /> : <MapPinned className="h-6 w-6 text-destructive" />}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${locationStatus === "inside" ? "text-emerald-500" : "text-destructive"}`}>
                    {locationStatus === "inside" ? "IN RANGE" : locationStatus === "checking" ? "CHECKING..." : "OUT OF RANGE"}
                  </span>
               </div>
               <div className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-accent/20 border border-border">
                  <Fingerprint className="h-6 w-6 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">BIO READY</span>
               </div>
            </div>

            {locationStatus === "outside" && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight text-center">Jarak: {distance}m. Silakan ke area kantor.</p>
              </div>
            )}

            {locationStatus === "inside" && distance !== null && (
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest text-center">
                Jarak ke titik terdekat: {distance}m
              </p>
            )}

            <Button
              variant="outline"
              onClick={() => setShowArea(true)}
              className="w-full h-12 rounded-2xl font-bold border-border hover:bg-accent transition-all text-sm"
            >
              <MapPinned className="h-5 w-5 mr-2" /> Lihat Area Absen
            </Button>

            <Button
              size="lg"
              disabled={locationStatus !== "inside" || isSubmitting || !activeEmployeeId}
              className={`w-full h-24 text-2xl font-bold rounded-[2rem] shadow-2xl transition-all hover:scale-[1.02] ${
                (locationStatus !== "inside" || !activeEmployeeId) ? "opacity-50 grayscale cursor-not-allowed" :
                status === "out" ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-destructive text-destructive-foreground shadow-destructive/20"
              }`}
              onClick={startCamera}
            >
              {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : status === "out" ? (
                <> <LogIn className="mr-4 h-8 w-8 stroke-[3]" /> Clock In Now </>
              ) : (
                <> <LogOut className="mr-4 h-8 w-8 stroke-[3]" /> Clock Out Now </>
              )}
            </Button>
          </div>
        </Card>

        {/* Detailed Logs & Weekly Recap */}
        <div className="lg:col-span-3 flex flex-col gap-8">
           <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-accent/10 border border-border p-1 rounded-2xl h-14 mb-6">
                 <TabsTrigger value="all" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-card data-[state=active]:text-foreground">Absensi Harian</TabsTrigger>
                 <TabsTrigger value="late" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500">Today's Late ({String(lateTodayCount).padStart(2, "0")})</TabsTrigger>
                 <TabsTrigger value="weekly" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Weekly Recap</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                 <div className="rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-border bg-accent/5">
                       <div className="flex flex-col">
                          <span className="font-bold text-lg text-foreground">
                             {isToday ? "Absensi Hari Ini" : "Absensi Tanggal Terpilih"}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                             {new Date(filterDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} • {dayLogs.length} entri
                          </span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Input
                             type="date"
                             value={filterDate}
                             max={toDateStr(new Date())}
                             onChange={(e) => setFilterDate(e.target.value || toDateStr(new Date()))}
                             className="h-11 w-auto bg-accent/20 border-border rounded-xl px-4 font-bold"
                          />
                          {!isToday && (
                             <Button variant="outline" onClick={() => setFilterDate(toDateStr(new Date()))} className="h-11 rounded-xl font-bold border-border text-xs">
                                Hari Ini
                             </Button>
                          )}
                       </div>
                    </div>
                    <Table>
                        <TableBody>
                           {isFetching ? (
                              <TableRow>
                                 <TableCell colSpan={4} className="h-40 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                    <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-[10px]">Memuat Data...</p>
                                 </TableCell>
                              </TableRow>
                           ) : dayLogs.length === 0 ? (
                              <TableRow>
                                 <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">Tidak ada absensi pada tanggal ini.</TableCell>
                              </TableRow>
                           ) : dayLogs.map(log => {
                              const late = log.clockIn ? lateMinutesFor(new Date(log.clockIn)) : 0
                              return (
                              <TableRow key={log.id} className={`h-24 border-border transition-all ${late > 0 ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-accent/5"}`}>
                                 <TableCell className={`pl-8 ${late > 0 ? "border-l-4 border-destructive" : ""}`}>
                                    <div className="flex flex-col">
                                       <span className="font-bold text-lg flex items-center gap-2">
                                          {log.employeeName || "Unknown"}
                                          {late > 0 && (
                                             <Badge className="bg-destructive/10 text-destructive border border-destructive/20 font-bold text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full">
                                                Telat {late} mnt
                                             </Badge>
                                          )}
                                       </span>
                                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                          {log.clockIn ? new Date(log.clockIn).toLocaleDateString() : "-"}
                                       </span>
                                    </div>
                                 </TableCell>
                                 <TableCell className={`font-mono font-bold ${late > 0 ? "text-destructive" : ""}`}>
                                    {log.clockIn ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                                    {log.clockOut ? ` - ${new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}
                                 </TableCell>
                                 <TableCell>
                                    <Badge className={`px-4 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest ${
                                       late > 0
                                          ? "bg-destructive/10 text-destructive border-destructive/20"
                                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    }`}>
                                       {late > 0 ? "Telat" : log.clockOut ? "Selesai" : "Aktif"}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="pr-8 text-right">
                                    {log.locationGps ? (
                                       <a
                                          href={`https://www.google.com/maps?q=${log.locationGps}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                                       >
                                          <MapPin className="h-4 w-4" /> Lokasi
                                       </a>
                                    ) : (
                                       <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                 </TableCell>
                              </TableRow>
                              )
                           })}
                        </TableBody>
                    </Table>
                 </div>
              </TabsContent>

              <TabsContent value="late">
                 <div className="rounded-[2.5rem] border border-border bg-card shadow-2xl overflow-hidden">
                    <Table>
                       <TableBody>
                          {todayLogs.filter(l => lateMinutesFor(new Date(l.clockIn)) > 0).length === 0 ? (
                             <TableRow>
                                <TableCell colSpan={3} className="h-40 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">Tidak ada keterlambatan hari ini.</TableCell>
                             </TableRow>
                          ) : todayLogs.filter(l => lateMinutesFor(new Date(l.clockIn)) > 0).map(log => {
                             const ci = new Date(log.clockIn)
                             return (
                             <TableRow key={log.id} className="h-24 border-border hover:bg-amber-500/5 transition-all">
                                <TableCell className="pl-8">
                                   <div className="flex flex-col">
                                      <span className="font-bold text-lg">{log.employeeName || "Unknown"}</span>
                                      <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Telat {lateMinutesFor(ci)} Menit</span>
                                   </div>
                                </TableCell>
                                <TableCell className="font-mono font-bold text-amber-500">{ci.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                                <TableCell className="text-right pr-8">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => setViewPhoto({ name: log.employeeName || "Unknown", time: ci.toLocaleString(), photo: log.photo || null })}
                                     className="text-xs font-bold text-muted-foreground hover:text-foreground"
                                   >View Photo</Button>
                                </TableCell>
                             </TableRow>
                          )})}
                       </TableBody>
                    </Table>
                 </div>
              </TabsContent>

              <TabsContent value="weekly">
                 <Card className="rounded-[2.5rem] border border-border bg-card shadow-2xl p-8">
                    <div className="space-y-6">
                       {weeklyLateRecap.map((day, idx) => (
                          <div key={idx} className="flex items-center justify-between group">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center font-bold text-xs uppercase text-muted-foreground">
                                   {day.day}
                                </div>
                                <div>
                                   <p className="font-bold text-foreground leading-none">{day.date}</p>
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Keterlambatan</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="h-2 w-32 bg-accent/20 rounded-full overflow-hidden">
                                   <div
                                      className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                      style={{ width: `${(day.count / maxLate) * 100}%` }}
                                   ></div>
                                </div>
                                <span className="text-xl font-bold text-amber-500 min-w-[30px] text-right">{day.count}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>
      </div>

      {/* Area Absen Dialog - shows valid check-in locations on a map */}
      <Dialog open={showArea} onOpenChange={setShowArea}>
        <DialogContent className="sm:max-w-[700px] bg-popover border-border rounded-[2.5rem] p-0 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-8 pb-4 bg-accent/5 border-b border-border">
            <DialogTitle className="text-2xl font-bold font-serif flex items-center gap-3">
              <MapPinned className="h-6 w-6 text-primary" /> Area Absen yang Valid
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 p-8 space-y-8">
            <p className="text-sm text-muted-foreground font-medium">
              Absen hanya dapat dilakukan jika berada dalam radius salah satu titik berikut.
            </p>
            {OFFICE_LOCATIONS.map((loc, idx) => (
              <div key={idx} className="rounded-2xl border border-border overflow-hidden bg-card">
                <div className="p-5 flex items-start justify-between gap-4 border-b border-border">
                  <div>
                    <p className="font-bold text-lg text-foreground">{loc.name}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      Radius {loc.radius}m • {loc.lat}, {loc.lng}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-bold text-primary hover:underline whitespace-nowrap"
                  >
                    Buka di Maps ↗
                  </a>
                </div>
                <iframe
                  title={loc.name}
                  src={`https://maps.google.com/maps?q=${loc.lat},${loc.lng}&z=16&output=embed`}
                  className="w-full h-64 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Photo Dialog - shows the face-verification photo taken at clock-in */}
      <Dialog open={!!viewPhoto} onOpenChange={(o) => { if (!o) setViewPhoto(null) }}>
        <DialogContent className="sm:max-w-[480px] bg-popover border-border rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{viewPhoto?.name}</DialogTitle>
          </DialogHeader>
          {viewPhoto?.time && (
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest -mt-2">{viewPhoto.time}</p>
          )}
          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl mt-2">
            {viewPhoto?.photo ? (
              <img src={viewPhoto.photo} alt={`Foto absen ${viewPhoto.name}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center gap-3 text-muted-foreground p-6">
                <Camera className="h-10 w-10 opacity-40" />
                <p className="text-sm font-bold">Tidak ada foto untuk absensi ini.</p>
                <p className="text-[10px] uppercase tracking-widest">Absensi lama direkam sebelum fitur foto aktif.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog Omitted but preserved logic ... */}
      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="sm:max-w-[500px] bg-popover border-border rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Face Verification</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
            {!capturedPhoto ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover scale-x-[-1]" />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <DialogFooter className="sm:justify-center gap-4 pt-6">
            {!capturedPhoto ? (
              <Button onClick={capturePhoto} size="lg" className="h-16 w-full rounded-2xl bg-primary text-white font-bold">Ambil Foto</Button>
            ) : (
              <Button onClick={handleFinalSubmit} className="h-16 w-full rounded-2xl bg-emerald-600 text-white font-bold">Kirim Absensi</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
