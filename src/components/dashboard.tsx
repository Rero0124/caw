"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Badge } from "./ui/badge"
import { useLanguage } from "./language-provider"
import { Activity, Server, Users, HardDrive } from "lucide-react"

export function Dashboard() {
  const { t } = useLanguage()

  const [serviceStats, setServiceStats] = useState({
    totalServices: 4,
    activeServices: 2,
    totalConnections: 8,
    dataTransfer: 156,
  })

  const [runningServices, setRunningServices] = useState([
    {
      name: t("sftpService"),
      status: "running",
      port: 22,
      connections: 3,
      uptime: 7200, // seconds
      dataTransfer: 45.2, // MB/s
    },
    {
      name: t("smbService"),
      status: "running",
      port: 445,
      connections: 5,
      uptime: 5400,
      dataTransfer: 23.8,
    },
    {
      name: "Web Dashboard",
      status: "running",
      port: 3000,
      connections: 1,
      uptime: 3600,
      dataTransfer: 2.1,
    },
    {
      name: "API Server",
      status: "stopped",
      port: 8080,
      connections: 0,
      uptime: 0,
      dataTransfer: 0,
    },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setServiceStats((prev) => ({
        ...prev,
        totalConnections: Math.floor(Math.random() * 20) + 5,
        dataTransfer: Math.floor(Math.random() * 200) + 50,
      }))

      setRunningServices((prev) =>
        prev.map((service) => ({
          ...service,
          connections: service.status === "running" ? Math.floor(Math.random() * 10) + 1 : 0,
          dataTransfer: service.status === "running" ? Math.random() * 50 + 10 : 0,
          uptime: service.status === "running" ? service.uptime + 5 : 0,
        })),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}${t("hours")} ${minutes}${t("minutes")}`
    } else if (minutes > 0) {
      return `${minutes}${t("minutes")} ${secs}${t("seconds")}`
    } else {
      return `${secs}${t("seconds")}`
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold">{t("dashboard")}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalServices")}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.totalServices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {serviceStats.activeServices} {t("activeServices").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("activeConnections")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.totalConnections}</div>
            <Progress value={(serviceStats.totalConnections / 50) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dataTransfer")}</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceStats.dataTransfer} MB/s</div>
            <Progress value={(serviceStats.dataTransfer / 500) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("serviceStatus")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {serviceStats.activeServices}/{serviceStats.totalServices}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("running").toLowerCase()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("services")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {runningServices.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      service.status === "running" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{service.name}</p>
                      <Badge variant={service.status === "running" ? "default" : "secondary"}>
                        {t(service.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("port")}: {service.port} | {t("connections")}: {service.connections}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{service.dataTransfer.toFixed(1)} MB/s</p>
                  <p className="text-xs text-muted-foreground">
                    {t("uptime")}: {formatUptime(service.uptime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
