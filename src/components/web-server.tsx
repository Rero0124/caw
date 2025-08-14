"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Badge } from "./ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { useLanguage } from "./language-provider"
import {
  Globe,
  Folder,
  Play,
  Square,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Users,
  Edit,
  Activity,
} from "lucide-react"

interface WebServerLog {
  id: string
  timestamp: string
  ipAddress: string
  requestMethod: string
  requestPath: string
  statusCode: number
  responseTime: string
  userAgent: string
}

export function WebServer() {
  const { t } = useLanguage()
  const [webServerRunning, setWebServerRunning] = useState(false)
  const [serverPort, setServerPort] = useState("8080")
  const [documentRoot, setDocumentRoot] = useState("/var/www/html")
  const [hostSetting, setHostSetting] = useState<"localOnly" | "allDevices" | "custom">("localOnly")
  const [customHost, setCustomHost] = useState("0.0.0.0")
  const [webFileShareEnabled, setWebFileShareEnabled] = useState(true)
  const [webDashboardEnabled, setWebDashboardEnabled] = useState(true)
  const [webServerLogs, setWebServerLogs] = useState<WebServerLog[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const savedSettings = localStorage.getItem("webServerSettings")
    const savedLogs = localStorage.getItem("webServerLogs")

    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setWebServerRunning(settings.running || false)
      setServerPort(settings.port || "8080")
      setDocumentRoot(settings.documentRoot || "/var/www/html")
      setHostSetting(settings.hostSetting || "localOnly")
      setCustomHost(settings.customHost || "0.0.0.0")
      setWebFileShareEnabled(settings.webFileShare !== false)
      setWebDashboardEnabled(settings.webDashboard !== false)
    }

    if (savedLogs) {
      setWebServerLogs(JSON.parse(savedLogs))
    } else {
      const sampleLogs: WebServerLog[] = Array.from({ length: 25 }, (_, i) => ({
        id: (i + 1).toString(),
        timestamp: new Date(Date.now() - 1000 * 60 * (i + 1) * 2).toLocaleString(),
        ipAddress: `192.168.1.${100 + (i % 20)}`,
        requestMethod: ["GET", "POST", "PUT", "DELETE"][i % 4],
        requestPath: [`/`, `/files`, `/dashboard`, `/api/status`, `/static/style.css`][i % 5],
        statusCode: [200, 404, 500, 301, 403][i % 5],
        responseTime: `${Math.floor(Math.random() * 500) + 10}ms`,
        userAgent: [
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        ][i % 3],
      }))
      setWebServerLogs(sampleLogs)
      localStorage.setItem("webServerLogs", JSON.stringify(sampleLogs))
    }
  }, [])

  const saveSettings = () => {
    const settings = {
      running: webServerRunning,
      port: serverPort,
      documentRoot,
      hostSetting,
      customHost,
      webFileShare: webFileShareEnabled,
      webDashboard: webDashboardEnabled,
    }
    localStorage.setItem("webServerSettings", JSON.stringify(settings))
  }

  useEffect(() => {
    saveSettings()
  }, [webServerRunning, serverPort, documentRoot, hostSetting, customHost, webFileShareEnabled, webDashboardEnabled])

  const handleStartStop = () => {
    setWebServerRunning(!webServerRunning)
  }

  const handleDocumentRootSelect = () => {
    const commonPaths = ["/var/www/html", "/usr/share/nginx/html", "/home/user/public_html", "/opt/webapp", "/srv/http"]
    const currentIndex = commonPaths.indexOf(documentRoot)
    const nextIndex = (currentIndex + 1) % commonPaths.length
    setDocumentRoot(commonPaths[nextIndex])
  }

  const getHostAddress = () => {
    switch (hostSetting) {
      case "localOnly":
        return "127.0.0.1"
      case "allDevices":
        return "0.0.0.0"
      case "custom":
        return customHost
      default:
        return "127.0.0.1"
    }
  }

  const getStatusCodeColor = (code: number) => {
    if (code >= 200 && code < 300) return "text-green-600"
    if (code >= 300 && code < 400) return "text-yellow-600"
    if (code >= 400 && code < 500) return "text-orange-600"
    if (code >= 500) return "text-red-600"
    return "text-gray-600"
  }

  const totalPages = Math.ceil(webServerLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentLogs = webServerLogs.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${webServerRunning ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800"}`}
            >
              <Globe
                className={`h-6 w-6 ${webServerRunning ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}
              />
            </div>
            {t("webServer")}
          </h2>
          <p className="text-muted-foreground mt-1">
            {webServerRunning ? `Running on http://${getHostAddress()}:${serverPort}` : t("webServerSettings")}
          </p>
        </div>
        <Badge
          variant={webServerRunning ? "default" : "secondary"}
          className={`px-4 py-2 text-sm font-medium ${
            webServerRunning
              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          <Activity className="h-4 w-4 mr-2" />
          {webServerRunning ? t("running") : t("stopped")}
        </Badge>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("webServerSettings")}
          </CardTitle>
          <CardDescription>{t("webServerDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 서버 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverPort" className="text-sm font-medium">
                {t("serverPort")}
              </Label>
              <Input
                id="serverPort"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
                disabled={webServerRunning}
                placeholder="8080"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("hostSettings")}</Label>
              <Select
                value={hostSetting}
                onValueChange={(value: "localOnly" | "allDevices" | "custom") => setHostSetting(value)}
                disabled={webServerRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="localOnly">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>{t("localOnly")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="allDevices">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{t("allDevices")}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <span>{t("customHost")}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hostSetting === "custom" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("customHostLabel")}</Label>
                <Input
                  value={customHost}
                  onChange={(e) => setCustomHost(e.target.value)}
                  disabled={webServerRunning}
                  placeholder="0.0.0.0"
                  className="font-mono"
                />
              </div>
            )}
          </div>

          {/* 문서 루트 설정 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("documentRoot")}</Label>
            <div className="flex gap-2">
              <Input
                value={documentRoot}
                onChange={(e) => setDocumentRoot(e.target.value)}
                disabled={webServerRunning}
                placeholder="/var/www/html"
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleDocumentRootSelect}
                disabled={webServerRunning}
                title={t("selectDocumentRoot")}
              >
                <Folder className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 웹 서비스 기능 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("webFeatures")}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{t("webFileShare")}</p>
                    <p className="text-sm text-muted-foreground">{t("browseAndShareFiles")}</p>
                  </div>
                </div>
                <Switch checked={webFileShareEnabled} onCheckedChange={setWebFileShareEnabled} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{t("webDashboard")}</p>
                    <p className="text-sm text-muted-foreground">{t("webControlPanel")}</p>
                  </div>
                </div>
                <Switch checked={webDashboardEnabled} onCheckedChange={setWebDashboardEnabled} />
              </div>
            </div>
          </div>

          {/* 시작/중지 버튼 */}
          <div className="flex justify-center pt-4 border-t">
            <Button
              onClick={handleStartStop}
              variant={webServerRunning ? "destructive" : "default"}
              size="lg"
              className={`min-w-[200px] h-12 text-base font-medium ${
                !webServerRunning &&
                "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              }`}
            >
              {webServerRunning ? (
                <>
                  <Square className="h-5 w-5 mr-2" />
                  {t("stopWebServer")}
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {t("startWebServer")}
                </>
              )}
            </Button>
          </div>

          {/* 활성 서비스 표시 */}
          {webServerRunning && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-medium text-green-800 dark:text-green-200 mb-2">{t("activeServices")}:</p>
              <div className="flex flex-wrap gap-2">
                {webFileShareEnabled && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                  >
                    <Folder className="h-3 w-3 mr-1" />
                    {t("fileShare")} (/files)
                  </Badge>
                )}
                {webDashboardEnabled && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    {t("dashboard")} (/dashboard)
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("webServerLog")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          {webServerLogs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("noWebServerLogs")}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("timestamp")}</TableHead>
                      <TableHead>{t("ipAddress")}</TableHead>
                      <TableHead>{t("requestMethod")}</TableHead>
                      <TableHead>{t("requestPath")}</TableHead>
                      <TableHead>{t("statusCode")}</TableHead>
                      <TableHead>{t("responseTime")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                        <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.requestMethod}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-xs truncate">{log.requestPath}</TableCell>
                        <TableCell>
                          <span className={`font-mono text-sm ${getStatusCodeColor(log.statusCode)}`}>
                            {log.statusCode}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.responseTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t("showing")} {startIndex + 1}-{Math.min(endIndex, webServerLogs.length)} {t("of")}{" "}
                    {webServerLogs.length} {t("entries")}
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
