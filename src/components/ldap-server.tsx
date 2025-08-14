"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Switch } from "./ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useLanguage } from "./language-provider"
import { Server, Users, Shield, Play, Square, Plus, Edit, Trash2 } from "lucide-react"

interface LDAPHostingConfig {
  port: number
  domainName: string
  adminUsername: string
  adminPassword: string
  enableSSL: boolean
  enableTLS: boolean
}

interface LDAPUser {
  id: string
  username: string
  email: string
  displayName: string
  groups: string[]
  createdAt: string
}

interface LDAPGroup {
  id: string
  name: string
  description: string
  members: string[]
  createdAt: string
}

export function LDAPServer() {
  const { t } = useLanguage()
  const [isServiceRunning, setIsServiceRunning] = useState(false)
  const [config, setConfig] = useState<LDAPHostingConfig>({
    port: 389,
    domainName: "example.com",
    adminUsername: "admin",
    adminPassword: "",
    enableSSL: false,
    enableTLS: false,
  })

  const [users, setUsers] = useState<LDAPUser[]>([])
  const [groups, setGroups] = useState<LDAPGroup[]>([])

  useEffect(() => {
    const savedConfig = localStorage.getItem("caw-ldap-hosting-config")
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }

    const savedServiceStatus = localStorage.getItem("caw-ldap-service-status")
    if (savedServiceStatus) {
      setIsServiceRunning(JSON.parse(savedServiceStatus))
    }

    // 샘플 데이터 로드
    loadSampleData()
  }, [])

  const loadSampleData = () => {
    const sampleUsers: LDAPUser[] = [
      {
        id: "1",
        username: "john.doe",
        email: "john.doe@example.com",
        displayName: "John Doe",
        groups: ["administrators", "users"],
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        username: "jane.smith",
        email: "jane.smith@example.com",
        displayName: "Jane Smith",
        groups: ["users", "developers"],
        createdAt: "2024-01-16",
      },
    ]

    const sampleGroups: LDAPGroup[] = [
      {
        id: "1",
        name: "administrators",
        description: "System administrators with full access",
        members: ["john.doe"],
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        name: "users",
        description: "Regular users with standard access",
        members: ["john.doe", "jane.smith"],
        createdAt: "2024-01-15",
      },
      {
        id: "3",
        name: "developers",
        description: "Development team members",
        members: ["jane.smith"],
        createdAt: "2024-01-16",
      },
    ]

    setUsers(sampleUsers)
    setGroups(sampleGroups)
  }

  const handleConfigChange = (field: keyof LDAPHostingConfig, value: string | number | boolean) => {
    if (isServiceRunning) return // 서비스 실행 중에는 설정 변경 불가

    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    localStorage.setItem("caw-ldap-hosting-config", JSON.stringify(newConfig))
  }

  const toggleService = () => {
    const newStatus = !isServiceRunning
    setIsServiceRunning(newStatus)
    localStorage.setItem("caw-ldap-service-status", JSON.stringify(newStatus))
  }

  const createUser = () => {
    const newUser: LDAPUser = {
      id: Date.now().toString(),
      username: `user${users.length + 1}`,
      email: `user${users.length + 1}@${config.domainName}`,
      displayName: `User ${users.length + 1}`,
      groups: ["users"],
      createdAt: new Date().toISOString().split("T")[0],
    }
    setUsers([...users, newUser])
  }

  const createGroup = () => {
    const newGroup: LDAPGroup = {
      id: Date.now().toString(),
      name: `group${groups.length + 1}`,
      description: `New group ${groups.length + 1}`,
      members: [],
      createdAt: new Date().toISOString().split("T")[0],
    }
    setGroups([...groups, newGroup])
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Server className="h-6 w-6" />
        <h1 className="text-3xl font-bold">{t("ldapServer")}</h1>
      </div>

      <Tabs defaultValue="hosting" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hosting">{t("ldapHosting")}</TabsTrigger>
          <TabsTrigger value="users">{t("ldapUsers")}</TabsTrigger>
          <TabsTrigger value="groups">{t("ldapGroups")}</TabsTrigger>
        </TabsList>

        <TabsContent value="hosting" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>{t("ldapServiceStatus")}</span>
                  </CardTitle>
                  <CardDescription>{t("ldapHostingDescription")}</CardDescription>
                </div>
                <Badge variant={isServiceRunning ? "default" : "secondary"}>
                  {isServiceRunning ? t("running") : t("stopped")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">{t("hostingPort")}</Label>
                  <Input
                    id="port"
                    type="number"
                    value={config.port}
                    onChange={(e) => handleConfigChange("port", Number.parseInt(e.target.value))}
                    disabled={isServiceRunning}
                    placeholder="389"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domainName">{t("domainName")}</Label>
                  <Input
                    id="domainName"
                    value={config.domainName}
                    onChange={(e) => handleConfigChange("domainName", e.target.value)}
                    disabled={isServiceRunning}
                    placeholder="example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminUsername">{t("adminUsername")}</Label>
                  <Input
                    id="adminUsername"
                    value={config.adminUsername}
                    onChange={(e) => handleConfigChange("adminUsername", e.target.value)}
                    disabled={isServiceRunning}
                    placeholder="admin"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">{t("adminPassword")}</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={config.adminPassword}
                    onChange={(e) => handleConfigChange("adminPassword", e.target.value)}
                    disabled={isServiceRunning}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableSSL"
                    checked={config.enableSSL}
                    onCheckedChange={(checked) => handleConfigChange("enableSSL", checked)}
                    disabled={isServiceRunning}
                  />
                  <Label htmlFor="enableSSL">{t("enableSSL")}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableTLS"
                    checked={config.enableTLS}
                    onCheckedChange={(checked) => handleConfigChange("enableTLS", checked)}
                    disabled={isServiceRunning}
                  />
                  <Label htmlFor="enableTLS">{t("enableTLS")}</Label>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button onClick={toggleService} variant={isServiceRunning ? "destructive" : "default"}>
                  {isServiceRunning ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      {t("stopLdapService")}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t("startLdapService")}
                    </>
                  )}
                </Button>

                {isServiceRunning && (
                  <div className="text-sm text-muted-foreground">
                    {t("servicePath")}: ldap://localhost:{config.port}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{t("ldapUsers")}</span>
                  </CardTitle>
                  <CardDescription>{t("ldapUsersDescription")}</CardDescription>
                </div>
                <Button onClick={createUser}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createUser")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{user.displayName}</div>
                      <div className="text-sm text-muted-foreground">{user.username}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {t("createdDate")}: {user.createdAt}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-wrap gap-1">
                        {user.groups.map((group) => (
                          <Badge key={group} variant="secondary">
                            {group}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>{t("ldapGroups")}</span>
                  </CardTitle>
                  <CardDescription>{t("ldapGroupsDescription")}</CardDescription>
                </div>
                <Button onClick={createGroup}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createGroup")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-muted-foreground">{group.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {t("createdDate")}: {group.createdAt}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("members")}: {group.members.join(", ") || t("none")}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {group.members.length} {group.members.length === 1 ? t("member") : t("members_plural")}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
