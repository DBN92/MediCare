import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Activity,
  Users,
  Calendar,
  Settings,
  BarChart3,
  Stethoscope,
  Heart,
  FileText,
} from "lucide-react"
import ColoSaudeLogo from './ColoSaudeLogo'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Pacientes", url: "/patients", icon: Users },
  { title: "Cuidados", url: "/care", icon: Heart },
  { title: "Relatórios", url: "/reports", icon: FileText },
  { title: "Configurações", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-64"} transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="border-r border-border bg-card/50 backdrop-blur-sm">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                <ColoSaudeLogo size="sm" />
              </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-base sm:text-lg text-foreground truncate">MediCare</h2>
                <p className="text-xs text-muted-foreground truncate">Sistema de Gestão</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="px-3 sm:px-4 py-2 text-muted-foreground text-xs sm:text-sm">
            {!isCollapsed && "Navegação"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="px-1 sm:px-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `${getNavClass({ isActive })} flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 text-sm`
                      }
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-secondary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">Sistema Online</p>
                <p className="text-xs text-muted-foreground truncate">Todos os sistemas funcionais</p>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}