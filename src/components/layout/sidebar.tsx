"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  CreditCard,
  TrendingUp,
  Settings,
  LogOut,
  FileText,
  Plane,
  ShieldCheck,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

type Role = "superadmin" | "admin" | "user"

interface User {
  name: string
  email: string
  role: Role
  avatar?: string
}

const allMenuItems = [
  {
    title: "Approval Center",
    url: "/approvals",
    icon: ShieldCheck,
    roles: ["superadmin", "admin"],
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin"],
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
    roles: ["superadmin", "admin"],
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: Clock,
    roles: ["superadmin", "admin", "user"],
  },
  {
    title: "Leave",
    url: "/leave",
    icon: Calendar,
    roles: ["superadmin", "admin", "user"],
  },
  {
    title: "Payroll",
    url: "/payroll",
    icon: CreditCard,
    roles: ["superadmin", "admin"],
  },
  {
    title: "Performance",
    url: "/performance",
    icon: TrendingUp,
    roles: ["superadmin", "admin", "user"],
  },
  {
    title: "HR Regulation",
    url: "/regulations",
    icon: FileText,
    roles: ["superadmin", "admin", "user"],
  },
  {
    title: "SPPD",
    url: "/sppd",
    icon: Plane,
    roles: ["superadmin", "admin", "user"],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["superadmin", "admin"],
  },
]

import { CompanySelector } from "@/components/CompanySelector"

import { useCompany } from "@/context/CompanyContext"

export function AppSidebar() {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const [user, setUser] = React.useState<User>({
    name: "Guest",
    email: "guest@koperasi.com",
    role: "user",
  })

  React.useEffect(() => {
    // Read from localStorage on mount (Client-side only)
    const storedRole = localStorage.getItem("userRole") as Role
    const storedName = localStorage.getItem("userName")
    
    if (storedRole) {
      setUser({
        name: storedName || "User",
        email: storedRole === "superadmin" ? "admin@koperasi.com" : "user@koperasi.com",
        role: storedRole,
      })
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    router.push("/login")
  }

  const filteredItems = allMenuItems.filter((item) => 
    item.roles.includes(user.role)
  )

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader>
        <div className="flex flex-col items-start gap-4 py-8 group-data-[collapsible=icon]:items-center">
          <div className="px-8 w-full group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="bg-white p-3 rounded-2xl shadow-sm inline-block">
              <img src={selectedCompany?.logo || "/logo-kowika.png"} alt={selectedCompany?.name || "Logo"} className="h-10 w-auto object-contain group-data-[collapsible=icon]:h-6 transition-all" />
            </div>
          </div>
          
          <div className="w-full group-data-[collapsible=icon]:hidden">
            <CompanySelector />
          </div>
          
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden px-8">
            <span className="text-[10px] text-primary font-bold tracking-[0.5em] uppercase opacity-80 border-t border-primary/20 pt-2">HR Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-4 gap-3">
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title} 
                render={<a href={item.url} />}
                className="text-muted-foreground hover:text-foreground hover:bg-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground transition-all rounded-xl px-5 py-8"
              >
                <item.icon className="size-7 mr-2 stroke-[2.5]" />
                <span className="text-[17px] font-bold tracking-tight">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          <SidebarMenuItem className="mt-4 pt-4 border-t border-border/50">
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all rounded-xl px-5 py-8"
            >
              <LogOut className="size-7 mr-2 stroke-[2.5]" />
              <span className="text-[17px] font-bold tracking-tight">Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-6 border-t border-border bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="text-foreground hover:bg-accent transition-all rounded-2xl p-4 shadow-sm" />}>
                <Avatar className="h-11 w-11 rounded-xl border border-border shadow-md">
                  <AvatarFallback className="rounded-xl bg-secondary text-secondary-foreground font-bold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden ml-2">
                  <span className="truncate font-bold text-foreground text-[16px]">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-70">{user.role}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-72 rounded-3xl bg-popover border-border text-popover-foreground shadow-2xl p-3 border"
                side="top"
                align="start"
                sideOffset={16}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-4 px-4 py-5 text-left text-sm">
                    <Avatar className="h-12 w-12 rounded-xl border border-border shadow-sm">
                      <AvatarFallback className="rounded-xl bg-secondary text-secondary-foreground font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-bold text-foreground text-[17px]">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground font-medium">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer py-4 px-5 rounded-xl transition-colors">
                  <LogOut className="mr-4 h-5 w-5" />
                  <span className="font-bold text-[15px]">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail className="hover:after:bg-primary/20" />
    </Sidebar>
  )
}
