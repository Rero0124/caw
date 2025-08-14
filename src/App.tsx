import "./styles/globals.css";
import { useEffect, useState } from "react";
import { Dashboard } from "./components/dashboard";
import { FileShare } from "./components/file-share";
import { QuickActions } from "./components/quick-actions";
import { PersonalData } from "./components/personal-data";
import { LDAPServer } from "./components/ldap-server";
import { ThemeProvider } from "./components/theme-provider";
import { LanguageProvider } from "./components/language-provider";
import { Sidebar } from "./components/sidebar";
import { BottomNavigation } from "./components/bottom-navigation";
import { WebServer } from "./components/web-server";
import { emit, listen } from "@tauri-apps/api/event";

type NoticePayload = { title: string; body: string };

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />
      case "file-share":
        return <FileShare />
      case "web-server": 
        return <WebServer />
      case "quick-actions":
        return <QuickActions />
      case "personal-data":
        return <PersonalData />
      case "ldap-server":
        return <LDAPServer />
      default:
        return <Dashboard />
    }
  }

  const handleAddShortcut = () => {
    setActiveTab("quick-actions")
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="flex h-screen bg-background">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div className="flex-1 flex flex-col h-full">
            <main className="flex-1 min-h-0 overflow-y-auto">{renderContent()}</main>
            <BottomNavigation
              onAddShortcut={handleAddShortcut}
              sidebarCollapsed={sidebarCollapsed}
            />
          </div>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App;