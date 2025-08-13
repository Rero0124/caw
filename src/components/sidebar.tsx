"use client"

import { Button } from "./ui/button"
import { useLanguage } from "./language-provider"
import { useTheme } from "./theme-provider"
import { LayoutDashboard, FolderOpen, Zap, Database, Server, Globe, Monitor, Moon, Sun, Menu } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ activeTab, onTabChange, isCollapsed, onToggle }: SidebarProps) {
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { id: "file-share", icon: FolderOpen, label: t("fileShare") },
    { id: "quick-actions", icon: Zap, label: t("quickActions") },
    { id: "personal-data", icon: Database, label: t("personalData") },
    { id: "ldap-server", icon: Server, label: t("ldapServer") },
  ]

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return Sun
      case "dark":
        return Moon
      default:
        return Monitor
    }
  }

  const ThemeIcon = getThemeIcon()

  return (
    <div
      className={`${isCollapsed ? "w-16" : "w-64"} h-screen bg-sidebar border-r border-sidebar-border p-4 flex flex-col overflow-hidden transition-all duration-300`}
    >
      <div className="mb-8 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 h-8 w-8"
            title={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        {!isCollapsed && (
          <>
            <h1 className="text-2xl font-bold text-sidebar-foreground">CAW</h1>
            <p className="text-sm text-sidebar-foreground/70">Combined All-in-one Workspace v0.1</p>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto min-h-0">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "secondary" : "ghost"}
            className={`w-full ${isCollapsed ? "justify-center px-2" : "justify-start"}`}
            onClick={() => onTabChange(item.id)}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={`h-4 w-4 ${!isCollapsed ? "mr-2" : ""}`} />
            {!isCollapsed && item.label}
          </Button>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="flex-shrink-0 space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <ThemeIcon className="h-4 w-4" />
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{t("system")}</SelectItem>
                <SelectItem value="light">{t("light")}</SelectItem>
                <SelectItem value="dark">{t("dark")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
