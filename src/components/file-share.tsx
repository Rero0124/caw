"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useLanguage } from "./language-provider"
import {
  Server,
  Play,
  Square,
  Folder,
  FileText,
  Download,
  Upload,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

interface ServiceConfig {
  port: string
  sharedFolder: string
  permissions: "readOnly" | "readWrite"
  running: boolean
}

interface AccessLog {
  id: string
  timestamp: string
  user: string
  ipAddress: string
  action: "download" | "upload" | "delete" | "view"
  file: string
  service: "SFTP" | "SMB"
}

export function FileShare() {
  const { t } = useLanguage()

  const sftpFolderInputRef = useRef<HTMLInputElement>(null)
  const smbFolderInputRef = useRef<HTMLInputElement>(null)

  const [sftpService, setSftpService] = useState<ServiceConfig>({
    port: "22",
    sharedFolder: "/home/shared",
    permissions: "readWrite",
    running: false,
  })

  const [smbService, setSmbService] = useState<ServiceConfig>({
    port: "445",
    sharedFolder: "/home/shared",
    permissions: "readWrite",
    running: false,
  })

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const savedSftpService = localStorage.getItem("sftpService")
    const savedSmbService = localStorage.getItem("smbService")
    const savedAccessLogs = localStorage.getItem("accessLogs")

    if (savedSftpService) {
      setSftpService(JSON.parse(savedSftpService))
    }
    if (savedSmbService) {
      setSmbService(JSON.parse(savedSmbService))
    }
    if (savedAccessLogs) {
      setAccessLogs(JSON.parse(savedAccessLogs))
    } else {
      const sampleLogs: AccessLog[] = Array.from({ length: 25 }, (_, i) => ({
        id: (i + 1).toString(),
        timestamp: new Date(Date.now() - 1000 * 60 * (i + 1) * 5).toLocaleString(),
        user: `user${(i % 5) + 1}`,
        ipAddress: `192.168.1.${100 + (i % 20)}`,
        action: ["download", "upload", "delete", "view"][i % 4] as "download" | "upload" | "delete" | "view",
        file: `/documents/file${i + 1}.${["pdf", "jpg", "mp4", "txt"][i % 4]}`,
        service: i % 2 === 0 ? "SFTP" : "SMB",
      }))
      setAccessLogs(sampleLogs)
      localStorage.setItem("accessLogs", JSON.stringify(sampleLogs))
    }
  }, [])

  const saveSftpService = (newConfig: ServiceConfig) => {
    setSftpService(newConfig)
    localStorage.setItem("sftpService", JSON.stringify(newConfig))
  }

  const saveSmbService = (newConfig: ServiceConfig) => {
    setSmbService(newConfig)
    localStorage.setItem("smbService", JSON.stringify(newConfig))
  }

  const toggleSftpService = () => {
    const newConfig = { ...sftpService, running: !sftpService.running }
    saveSftpService(newConfig)
  }

  const toggleSmbService = () => {
    const newConfig = { ...smbService, running: !smbService.running }
    saveSmbService(newConfig)
  }

  const handleSftpFolderSelect = () => {
    sftpFolderInputRef.current?.click()
  }

  const handleSmbFolderSelect = () => {
    smbFolderInputRef.current?.click()
  }

  const handleSftpFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const firstFile = files[0]
      const relativePath = firstFile.webkitRelativePath
      const folderName = relativePath.split("/")[0]

      const fullPath = `/home/user/${folderName}`

      console.log(t("sftpFolderSelection"), { relativePath, folderName, fullPath })

      saveSftpService({ ...sftpService, sharedFolder: fullPath })
    }

    event.target.value = ""
  }

  const handleSmbFolderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const firstFile = files[0]
      const relativePath = firstFile.webkitRelativePath
      const folderName = relativePath.split("/")[0]

      const fullPath = `/home/user/${folderName}`

      console.log(t("smbFolderSelection"), { relativePath, folderName, fullPath })

      saveSmbService({ ...smbService, sharedFolder: fullPath })
    }

    event.target.value = ""
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "download":
        return <Download className="h-4 w-4" />
      case "upload":
        return <Upload className="h-4 w-4" />
      case "delete":
        return <Trash2 className="h-4 w-4" />
      case "view":
        return <Eye className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const totalPages = Math.ceil(accessLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLogs = accessLogs.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <h2 className="text-3xl font-bold">{t("fileShare")}</h2>

      <input
        ref={sftpFolderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: "none" }}
        onChange={handleSftpFolderChange}
      />
      <input
        ref={smbFolderInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: "none" }}
        onChange={handleSmbFolderChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>SFTP {t("serviceSettings")}</span>
              <Badge variant={sftpService.running ? "default" : "secondary"}>
                {sftpService.running ? t("running") : t("stopped")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sftp-port">{t("port")}</Label>
              <Input
                id="sftp-port"
                placeholder="22"
                value={sftpService.port}
                onChange={(e) => saveSftpService({ ...sftpService, port: e.target.value })}
                disabled={sftpService.running}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sftp-folder">{t("sharedFolder")}</Label>
              <div className="flex space-x-2">
                <Input
                  id="sftp-folder"
                  placeholder="/home/shared"
                  value={sftpService.sharedFolder}
                  onChange={(e) => saveSftpService({ ...sftpService, sharedFolder: e.target.value })}
                  disabled={sftpService.running}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSftpFolderSelect}
                  disabled={sftpService.running}
                  title={t("selectFolder")}
                >
                  <Folder className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("accessPermissions")}</Label>
              <Select
                value={sftpService.permissions}
                onValueChange={(value: "readOnly" | "readWrite") =>
                  saveSftpService({ ...sftpService, permissions: value })
                }
                disabled={sftpService.running}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="readOnly">{t("readOnly")}</SelectItem>
                  <SelectItem value="readWrite">{t("readWrite")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={toggleSftpService}
              className="w-full"
              variant={sftpService.running ? "destructive" : "default"}
            >
              {sftpService.running ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  {t("stopService")}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {t("startService")}
                </>
              )}
            </Button>
            {sftpService.running && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <p>
                  <strong>{t("servicePath")}:</strong> sftp://localhost:{sftpService.port}
                </p>
                <p>
                  <strong>{t("sharedFolder")}:</strong> {sftpService.sharedFolder}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>SMB {t("serviceSettings")}</span>
              <Badge variant={smbService.running ? "default" : "secondary"}>
                {smbService.running ? t("running") : t("stopped")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smb-port">{t("port")}</Label>
              <Input
                id="smb-port"
                placeholder="445"
                value={smbService.port}
                onChange={(e) => saveSmbService({ ...smbService, port: e.target.value })}
                disabled={smbService.running}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smb-folder">{t("sharedFolder")}</Label>
              <div className="flex space-x-2">
                <Input
                  id="smb-folder"
                  placeholder="/home/shared"
                  value={smbService.sharedFolder}
                  onChange={(e) => saveSmbService({ ...smbService, sharedFolder: e.target.value })}
                  disabled={smbService.running}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSmbFolderSelect}
                  disabled={smbService.running}
                  title={t("selectFolder")}
                >
                  <Folder className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("accessPermissions")}</Label>
              <Select
                value={smbService.permissions}
                onValueChange={(value: "readOnly" | "readWrite") =>
                  saveSmbService({ ...smbService, permissions: value })
                }
                disabled={smbService.running}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="readOnly">{t("readOnly")}</SelectItem>
                  <SelectItem value="readWrite">{t("readWrite")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={toggleSmbService}
              className="w-full"
              variant={smbService.running ? "destructive" : "default"}
            >
              {smbService.running ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  {t("stopService")}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {t("startService")}
                </>
              )}
            </Button>
            {smbService.running && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                <p>
                  <strong>{t("servicePath")}:</strong> \\\\localhost\\shared
                </p>
                <p>
                  <strong>{t("sharedFolder")}:</strong> {smbService.sharedFolder}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{t("accessLog")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {accessLogs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("noAccessLogs")}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("timestamp")}</TableHead>
                      <TableHead>{t("user")}</TableHead>
                      <TableHead>{t("ipAddress")}</TableHead>
                      <TableHead>{t("action")}</TableHead>
                      <TableHead>{t("file")}</TableHead>
                      <TableHead>{t("service")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getActionIcon(log.action)}
                            <span>{t(log.action)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-xs truncate">{log.file}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.service}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t("showing")} {startIndex + 1}-{Math.min(endIndex, accessLogs.length)} {t("of")}{" "}
                    {accessLogs.length} {t("entries")}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {t("previous")}
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {t("next")}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
