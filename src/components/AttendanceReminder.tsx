"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Toaster, toast } from "sonner"
import { getTodayAttendanceStatus } from "@/app/actions/attendance"
import { isHoliday } from "@/lib/holidays"

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000
const CHECK_INTERVAL_MS = 60 * 1000

type Slot = { id: string; kind: "in" | "out"; from: number; until: number; title: string; body: string }

// Minutes since midnight (WIB). Each slot fires at most once per day.
const SLOTS: Slot[] = [
  { id: "in1", kind: "in", from: 7 * 60 + 15, until: 7 * 60 + 35, title: "Waktunya absen masuk", body: "Jangan lupa absen masuk hari ini." },
  { id: "in2", kind: "in", from: 7 * 60 + 35, until: 12 * 60, title: "Anda belum absen masuk", body: "Segera absen agar tidak terhitung terlambat/alpha. Lupa absen? Ajukan Presensi Manual di menu Leave." },
  { id: "out1", kind: "out", from: 16 * 60, until: 16 * 60 + 30, title: "Waktunya absen pulang", body: "Jangan lupa absen pulang sebelum meninggalkan kantor." },
  { id: "out2", kind: "out", from: 16 * 60 + 30, until: 24 * 60, title: "Anda belum absen pulang", body: "Absen pulang Anda hari ini belum tercatat." },
]

const safeGet = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch {} }

function wibNow() {
  const w = new Date(Date.now() + WIB_OFFSET_MS)
  return {
    dateStr: w.toISOString().split("T")[0],
    minutes: w.getUTCHours() * 60 + w.getUTCMinutes(),
    dow: w.getUTCDay(),
  }
}

export function AttendanceReminder() {
  const router = useRouter()

  const notify = React.useCallback(
    (slot: Slot) => {
      toast(slot.title, {
        id: `absen-${slot.id}`,
        description: slot.body,
        duration: 15000,
        action: { label: "Buka Absensi", onClick: () => router.push("/attendance") },
      })
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          const n = new Notification(slot.title, {
            body: slot.body,
            icon: "/icon-kowika.png",
            tag: `absen-${slot.id}`,
          })
          n.onclick = () => {
            window.focus()
            router.push("/attendance")
            n.close()
          }
        } catch {}
      }
    },
    [router]
  )

  React.useEffect(() => {
    const employeeId = safeGet("employeeId")
    if (!employeeId) return // e.g. superadmin without an employee record

    // One-time prompt to enable browser notifications (needs a user gesture).
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default" &&
      !safeGet("attendanceNotifPromptDismissed")
    ) {
      toast("Aktifkan notifikasi pengingat absen?", {
        description: "Dapatkan pengingat absen masuk & pulang di perangkat Anda.",
        duration: 20000,
        action: { label: "Aktifkan", onClick: () => { Notification.requestPermission() } },
        onDismiss: () => safeSet("attendanceNotifPromptDismissed", "1"),
        onAutoClose: () => safeSet("attendanceNotifPromptDismissed", "1"),
      })
    }

    let busy = false
    const check = async () => {
      if (busy) return
      const { dateStr, minutes, dow } = wibNow()
      if (dow === 0 || dow === 6 || isHoliday(dateStr)) return

      const slot = SLOTS.find((s) => minutes >= s.from && minutes < s.until)
      if (!slot) return
      const key = `attendanceReminder:${dateStr}:${slot.id}`
      if (safeGet(key)) return

      // Claim the slot before awaiting so concurrent checks (React strict-mode
      // double effects, visibility changes) can't fire it twice; release it
      // only if the status lookup fails so the next tick retries.
      safeSet(key, "1")
      busy = true
      try {
        const st = await getTodayAttendanceStatus(employeeId)
        if (!st.success) {
          try { localStorage.removeItem(key) } catch {}
          return
        }
        if (st.onLeave) return
        const needs = slot.kind === "in" ? !st.clockedIn : st.clockedIn && !st.clockedOut
        if (needs) notify(slot)
      } finally {
        busy = false
      }
    }

    check()
    const timer = setInterval(check, CHECK_INTERVAL_MS)
    const onVisible = () => { if (document.visibilityState === "visible") check() }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [notify])

  return <Toaster position="top-right" theme="dark" richColors />
}
