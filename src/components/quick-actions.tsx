"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card as CardComponent, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useLanguage } from "./language-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Upload } from "lucide-react"
import {
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  Monitor,
  Play,
  Star,
  Heart,
  Home,
  Settings,
  User,
  Calendar,
  Camera,
  Music,
  Video,
  File,
  Folder,
  Search,
  Bell,
  Lock,
  Wifi,
  Battery,
  Download,
  Share,
  Copy,
  Save,
  RefreshCwIcon as Refresh,
  Zap,
  Target,
  Award,
  Bookmark,
  Flag,
  Tag,
  Clock,
  Map,
  Shield,
  Key,
  Eye,
  Volume2,
  Sun,
  Moon,
  Cloud,
  Coffee,
  Car,
  Plane,
  Gamepad2,
  Headphones,
  Smartphone,
  Laptop,
  Database,
  Server,
  Code,
  Terminal,
  Wrench,
  Hammer,
  Paintbrush,
  Lightbulb,
  Flame,
  Droplet,
  Leaf,
  Flower,
  TreesIcon as Tree,
} from "lucide-react"

interface Shortcut {
  id: string
  name: string
  command: string
  type: string
  icon?: string
  customImage?: string
}

type ShortcutType = "phone" | "email" | "website" | "application" | "custom"

const iconOptions = [
  { name: "phone", icon: Phone },
  { name: "mail", icon: Mail },
  { name: "globe", icon: Globe },
  { name: "monitor", icon: Monitor },
  { name: "play", icon: Play },
  { name: "star", icon: Star },
  { name: "heart", icon: Heart },
  { name: "home", icon: Home },
  { name: "settings", icon: Settings },
  { name: "user", icon: User },
  { name: "calendar", icon: Calendar },
  { name: "camera", icon: Camera },
  { name: "music", icon: Music },
  { name: "video", icon: Video },
  { name: "file", icon: File },
  { name: "folder", icon: Folder },
  { name: "search", icon: Search },
  { name: "bell", icon: Bell },
  { name: "lock", icon: Lock },
  { name: "wifi", icon: Wifi },
  { name: "battery", icon: Battery },
  { name: "download", icon: Download },
  { name: "share", icon: Share },
  { name: "copy", icon: Copy },
  { name: "save", icon: Save },
  { name: "refresh", icon: Refresh },
  { name: "zap", icon: Zap },
  { name: "target", icon: Target },
  { name: "award", icon: Award },
  { name: "bookmark", icon: Bookmark },
  { name: "flag", icon: Flag },
  { name: "tag", icon: Tag },
  { name: "clock", icon: Clock },
  { name: "map", icon: Map },
  { name: "shield", icon: Shield },
  { name: "key", icon: Key },
  { name: "eye", icon: Eye },
  { name: "volume2", icon: Volume2 },
  { name: "sun", icon: Sun },
  { name: "moon", icon: Moon },
  { name: "cloud", icon: Cloud },
  { name: "coffee", icon: Coffee },
  { name: "car", icon: Car },
  { name: "plane", icon: Plane },
  { name: "gamepad2", icon: Gamepad2 },
  { name: "headphones", icon: Headphones },
  { name: "smartphone", icon: Smartphone },
  { name: "laptop", icon: Laptop },
  { name: "database", icon: Database },
  { name: "server", icon: Server },
  { name: "code", icon: Code },
  { name: "terminal", icon: Terminal },
  { name: "wrench", icon: Wrench },
  { name: "hammer", icon: Hammer },
  { name: "paintbrush", icon: Paintbrush },
  { name: "lightbulb", icon: Lightbulb },
  { name: "flame", icon: Flame },
  { name: "droplet", icon: Droplet },
  { name: "leaf", icon: Leaf },
  { name: "flower", icon: Flower },
  { name: "tree", icon: Tree },
]

export function QuickActions() {
  const { t } = useLanguage()
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
  const [newShortcut, setNewShortcut] = useState({
    name: "",
    command: "",
    type: "custom" as ShortcutType,
    icon: "",
    customImage: "",
  })
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const savedShortcuts = localStorage.getItem("caw-shortcuts")
    if (savedShortcuts) {
      setShortcuts(JSON.parse(savedShortcuts))
    }
  }, [])

  const saveShortcuts = (updatedShortcuts: Shortcut[]) => {
    setShortcuts(updatedShortcuts)
    localStorage.setItem("caw-shortcuts", JSON.stringify(updatedShortcuts))
    window.dispatchEvent(new Event("caw-shortcuts-updated"))
  }

  const getCommandPrefix = (type: ShortcutType): string => {
    switch (type) {
      case "phone":
        return "tel:"
      case "email":
        return "mailto:"
      case "website":
        return "https://"
      case "application":
        return ""
      case "custom":
        return ""
      default:
        return ""
    }
  }

  const getPlaceholder = (type: ShortcutType): string => {
    switch (type) {
      case "phone":
        return t("phoneNumber")
      case "email":
        return t("emailAddress")
      case "website":
        return t("websiteUrl")
      case "application":
        return t("applicationPath")
      case "custom":
        return t("customCommand")
      default:
        return t("command")
    }
  }

  const getIconComponent = (iconName: string, customImage?: string) => {
    if (iconName === "custom" && customImage) {
      return <img src={customImage || "/placeholder.svg"} alt="Custom icon" className="h-4 w-4 rounded object-cover" />
    }

    const iconOption = iconOptions.find((option) => option.name === iconName)
    if (iconOption) {
      const IconComponent = iconOption.icon
      return <IconComponent className="h-4 w-4" />
    }
    return <Play className="h-4 w-4" />
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "website":
        return <Globe className="h-4 w-4" />
      case "application":
        return <Monitor className="h-4 w-4" />
      default:
        return <Play className="h-4 w-4" />
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Image = e.target?.result as string
        if (editingShortcut) {
          setEditingShortcut({ ...editingShortcut, icon: "custom", customImage: base64Image })
        } else {
          setNewShortcut({ ...newShortcut, icon: "custom", customImage: base64Image })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const addShortcut = () => {
    if (newShortcut.name && newShortcut.command) {
      const prefix = getCommandPrefix(newShortcut.type)
      const command =
        newShortcut.type === "custom" || newShortcut.type === "application"
          ? newShortcut.command
          : prefix + newShortcut.command.replace(prefix, "")

      const shortcut: Shortcut = {
        id: Date.now().toString(),
        name: newShortcut.name,
        command: command,
        type: newShortcut.type,
        icon: newShortcut.icon,
        customImage: newShortcut.customImage,
      }
      saveShortcuts([...shortcuts, shortcut])
      setNewShortcut({ name: "", command: "", type: "custom", icon: "", customImage: "" })
      setIsDialogOpen(false)
    }
  }

  const updateShortcut = () => {
    if (editingShortcut && editingShortcut.name && editingShortcut.command) {
      const prefix = getCommandPrefix(editingShortcut.type as ShortcutType)
      const command =
        editingShortcut.type === "custom" || editingShortcut.type === "application"
          ? editingShortcut.command
          : prefix + editingShortcut.command.replace(prefix, "")

      const updatedShortcuts = shortcuts.map((s) => (s.id === editingShortcut.id ? { ...editingShortcut, command } : s))
      saveShortcuts(updatedShortcuts)
      setEditingShortcut(null)
      setIsDialogOpen(false)
    }
  }

  const deleteShortcut = (id: string) => {
    const updatedShortcuts = shortcuts.filter((s) => s.id !== id)
    saveShortcuts(updatedShortcuts)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t("quickActions")}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingShortcut(null)
                setNewShortcut({ name: "", command: "", type: "custom", icon: "", customImage: "" })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("addShortcut")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingShortcut ? t("edit") : t("addShortcut")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shortcut-name">{t("shortcutName")}</Label>
                <Input
                  id="shortcut-name"
                  value={editingShortcut ? editingShortcut.name : newShortcut.name}
                  onChange={(e) => {
                    if (editingShortcut) {
                      setEditingShortcut({ ...editingShortcut, name: e.target.value })
                    } else {
                      setNewShortcut({ ...newShortcut, name: e.target.value })
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortcut-type">{t("shortcutType")}</Label>
                <Select
                  value={editingShortcut ? editingShortcut.type : newShortcut.type}
                  onValueChange={(value: ShortcutType) => {
                    if (editingShortcut) {
                      setEditingShortcut({ ...editingShortcut, type: value, command: "" })
                    } else {
                      setNewShortcut({ ...newShortcut, type: value, command: "" })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        {t("phone")}
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4" />
                        {t("email")}
                      </div>
                    </SelectItem>
                    <SelectItem value="website">
                      <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4" />
                        {t("website")}
                      </div>
                    </SelectItem>
                    <SelectItem value="application">
                      <div className="flex items-center">
                        <Monitor className="mr-2 h-4 w-4" />
                        {t("application")}
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center">
                        <Play className="mr-2 h-4 w-4" />
                        {t("custom")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortcut-icon">{t("icon")}</Label>
                <Select
                  value={editingShortcut ? editingShortcut.icon || "none" : newShortcut.icon}
                  onValueChange={(value) => {
                    if (editingShortcut) {
                      setEditingShortcut({
                        ...editingShortcut,
                        icon: value,
                        customImage: value === "custom" ? editingShortcut.customImage : "",
                      })
                    } else {
                      setNewShortcut({
                        ...newShortcut,
                        icon: value,
                        customImage: value === "custom" ? newShortcut.customImage : "",
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectIcon")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4" />
                        {t("noIcon")}
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center">
                        <Upload className="mr-2 h-4 w-4" />
                        {t("customImage")}
                      </div>
                    </SelectItem>
                    {iconOptions.map((option) => {
                      const IconComponent = option.icon
                      return (
                        <SelectItem key={option.name} value={option.name}>
                          <div className="flex items-center">
                            <IconComponent className="mr-2 h-4 w-4" />
                            {option.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                {((editingShortcut && editingShortcut.icon === "custom") ||
                  (!editingShortcut && newShortcut.icon === "custom")) && (
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">{t("uploadCustomIcon")}</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1"
                      />
                      {((editingShortcut && editingShortcut.customImage) ||
                        (!editingShortcut && newShortcut.customImage)) && (
                        <div className="flex items-center space-x-2">
                          <img
                            src={editingShortcut ? editingShortcut.customImage : newShortcut.customImage}
                            alt="Preview"
                            className="h-8 w-8 rounded object-cover border"
                          />
                          <span className="text-sm text-green-600">{t("imageUploaded")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortcut-command">
                  {editingShortcut
                    ? getPlaceholder(editingShortcut.type as ShortcutType)
                    : getPlaceholder(newShortcut.type)}
                </Label>
                <div className="flex">
                  {((editingShortcut && editingShortcut.type !== "custom" && editingShortcut.type !== "application") ||
                    (!editingShortcut && newShortcut.type !== "custom" && newShortcut.type !== "application")) && (
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                      {editingShortcut
                        ? getCommandPrefix(editingShortcut.type as ShortcutType)
                        : getCommandPrefix(newShortcut.type)}
                    </div>
                  )}
                  <Input
                    id="shortcut-command"
                    className={
                      (editingShortcut &&
                        editingShortcut.type !== "custom" &&
                        editingShortcut.type !== "application") ||
                      (!editingShortcut && newShortcut.type !== "custom" && newShortcut.type !== "application")
                        ? "rounded-l-none"
                        : ""
                    }
                    placeholder={
                      editingShortcut
                        ? getPlaceholder(editingShortcut.type as ShortcutType)
                        : getPlaceholder(newShortcut.type)
                    }
                    value={editingShortcut ? editingShortcut.command : newShortcut.command}
                    onChange={(e) => {
                      if (editingShortcut) {
                        setEditingShortcut({ ...editingShortcut, command: e.target.value })
                      } else {
                        setNewShortcut({ ...newShortcut, command: e.target.value })
                      }
                    }}
                  />
                </div>
              </div>
              <Button onClick={editingShortcut ? updateShortcut : addShortcut} className="w-full">
                {t("save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {shortcut.icon ? getIconComponent(shortcut.icon, shortcut.customImage) : getTypeIcon(shortcut.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{shortcut.name}</h3>
                <p className="text-sm text-muted-foreground font-mono truncate">{shortcut.command}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingShortcut(shortcut)
                  setIsDialogOpen(true)
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteShortcut(shortcut.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {shortcuts.length === 0 && (
        <CardComponent>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {t("noShortcutsYet")}
              <br />
              {t("addNewShortcut")}
            </p>
          </CardContent>
        </CardComponent>
      )}
    </div>
  )
}
