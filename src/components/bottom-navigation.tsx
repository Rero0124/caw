"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { useLanguage } from "./language-provider"
import { Plus, Phone, Mail, Globe, Monitor, Play } from "lucide-react"

interface Shortcut {
  id: string
  name: string
  command: string
  type: string
  icon?: string
  customImage?: string // customImage 필드 추가
}

interface BottomNavigationProps {
  onAddShortcut: () => void
  sidebarCollapsed: boolean
}

const iconOptions = [
  { name: "phone", icon: Phone },
  { name: "mail", icon: Mail },
  { name: "globe", icon: Globe },
  { name: "monitor", icon: Monitor },
  { name: "play", icon: Play },
  // ... 다른 아이콘들은 필요에 따라 추가
]

export function BottomNavigation({ onAddShortcut, sidebarCollapsed }: BottomNavigationProps) {
  const { t } = useLanguage()
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])

  useEffect(() => {
    const savedShortcuts = localStorage.getItem("caw-shortcuts")
    if (savedShortcuts) {
      setShortcuts(JSON.parse(savedShortcuts))
    }

    // localStorage 변경 감지
    const handleStorageChange = () => {
      const savedShortcuts = localStorage.getItem("caw-shortcuts")
      if (savedShortcuts) {
        setShortcuts(JSON.parse(savedShortcuts))
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // 같은 탭에서의 변경사항도 감지하기 위한 커스텀 이벤트
    const handleCustomStorageChange = () => {
      const savedShortcuts = localStorage.getItem("caw-shortcuts")
      if (savedShortcuts) {
        setShortcuts(JSON.parse(savedShortcuts))
      }
    }

    window.addEventListener("caw-shortcuts-updated", handleCustomStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("caw-shortcuts-updated", handleCustomStorageChange)
    }
  }, [])

  const getIconComponent = (iconName: string, customImage?: string) => {
    if (iconName === "custom" && customImage) {
      return <img src={customImage || "/placeholder.svg"} alt="Custom icon" className="h-5 w-5 rounded object-cover" />
    }

    const iconOption = iconOptions.find((option) => option.name === iconName)
    if (iconOption) {
      const IconComponent = iconOption.icon
      return <IconComponent className="h-5 w-5" />
    }
    return <Play className="h-5 w-5" />
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="h-5 w-5" />
      case "email":
        return <Mail className="h-5 w-5" />
      case "website":
        return <Globe className="h-5 w-5" />
      case "application":
        return <Monitor className="h-5 w-5" />
      default:
        return <Play className="h-5 w-5" />
    }
  }

  const executeShortcut = (command: string, type: string) => {
    if (type === "phone" || type === "email" || type === "website") {
      window.open(command, "_blank")
    } else {
      // 브라우저 환경에서는 실제 명령어 실행이 불가능하므로 알림으로 대체
      alert(`${t("execute")}: ${command}`)
    }
  }

  // 최대 6개까지만 표시 (+ 버튼 포함해서 7개)
  const displayShortcuts = shortcuts.slice(0, 6)

  return (
    <div
      className={`fixed bottom-0 ${sidebarCollapsed ? "left-16" : "left-64"} right-0 bg-background border-t border-border transition-all duration-300`}
    >
      <div className="flex items-center justify-center px-4 py-2">
        <div className="flex space-x-2 overflow-x-auto max-w-full">
          {displayShortcuts.map((shortcut) => (
            <Button
              key={shortcut.id}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 flex flex-col items-center p-2 h-auto min-w-[60px]"
              onClick={() => executeShortcut(shortcut.command, shortcut.type)}
              title={shortcut.name}
            >
              <div className="mb-1">
                {shortcut.icon ? getIconComponent(shortcut.icon, shortcut.customImage) : getTypeIcon(shortcut.type)}
              </div>
              <span className="text-xs truncate max-w-[50px]">{shortcut.name}</span>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 flex flex-col items-center p-2 h-auto min-w-[60px]"
            onClick={onAddShortcut}
            title={t("addQuickAction")}
          >
            <div className="mb-1">
              <Plus className="h-5 w-5" />
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}
