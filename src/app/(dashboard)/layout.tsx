"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const adminOnlyRoutes = ["/dashboard", "/employees", "/payroll", "/settings"]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const storedRole = localStorage.getItem("userRole")
    
    // Simple Auth Check
    if (!storedRole) {
      router.push("/login")
      return
    }

    const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))
    
    if (isAdminRoute && storedRole === "user") {
      router.push("/attendance")
      setIsAuthorized(false)
    } else {
      setIsAuthorized(true)
    }
  }, [pathname, router])

  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)
    if (segments.length === 0) return "Home"
    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }

  // Prevent flicker during check
  if (isAuthorized === null) return null

  return (
    <SidebarProvider className="bg-background">
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-20 shrink-0 items-center gap-4 border-b border-border px-4 md:px-8 sticky top-0 z-50 bg-background/60 backdrop-blur-xl">
          <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-primary transition-colors scale-110" />
          <Separator orientation="vertical" className="mr-3 h-6 bg-border" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard" className="text-muted-foreground font-bold hover:text-primary transition-all tracking-tight">
                  Koperasi HR
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block text-muted-foreground/50 scale-125" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-bold tracking-tight">
                  {getPageTitle(pathname)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-14 relative overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none animate-pulse duration-[10s]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none animate-pulse duration-[8s]"></div>
          
          <div className="relative z-10 w-full max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
