"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { useLanguage } from "./language-provider"
import { FileText, ImageIcon, Video, Plus, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface DataItem {
  id: string
  title: string
  content: string
  type: "note" | "document" | "image" | "video"
  createdAt: string
}

export function PersonalData() {
  const { t } = useLanguage()
  const [dataItems, setDataItems] = useState<DataItem[]>([])
  const [newItem, setNewItem] = useState({ title: "", content: "", type: "note" as const })

  useEffect(() => {
    const savedData = localStorage.getItem("caw-personal-data")
    if (savedData) {
      setDataItems(JSON.parse(savedData))
    }
  }, [])

  const saveData = (updatedData: DataItem[]) => {
    setDataItems(updatedData)
    localStorage.setItem("caw-personal-data", JSON.stringify(updatedData))
  }

  const addItem = () => {
    if (newItem.title && newItem.content) {
      const item: DataItem = {
        id: Date.now().toString(),
        title: newItem.title,
        content: newItem.content,
        type: newItem.type,
        createdAt: new Date().toISOString(),
      }
      saveData([...dataItems, item])
      setNewItem({ title: "", content: "", type: "note" })
    }
  }

  const deleteItem = (id: string) => {
    const updatedData = dataItems.filter((item) => item.id !== id)
    saveData(updatedData)
  }

  const getItemsByType = (type: string) => {
    return dataItems.filter((item) => item.type === type)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "note":
        return <FileText className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getEmptyMessage = (type: string) => {
    switch (type) {
      case "note":
        return t("noNotesStored")
      case "document":
        return t("noDocumentsStored")
      case "image":
        return t("noImagesStored")
      case "video":
        return t("noVideosStored")
      default:
        return ""
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold">{t("personalData")}</h2>

      <Card>
        <CardHeader>
          <CardTitle>{t("addNewItem")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-title">{t("title")}</Label>
              <Input
                id="item-title"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-type">{t("type")}</Label>
              <select
                id="item-type"
                className="w-full p-2 border rounded-md"
                value={newItem.type}
                onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
              >
                <option value="note">{t("notes")}</option>
                <option value="document">{t("documents")}</option>
                <option value="image">{t("images")}</option>
                <option value="video">{t("videos")}</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-content">{t("content")}</Label>
            <Textarea
              id="item-content"
              rows={4}
              value={newItem.content}
              onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
            />
          </div>
          <Button onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="note" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="note">{t("notes")}</TabsTrigger>
          <TabsTrigger value="document">{t("documents")}</TabsTrigger>
          <TabsTrigger value="image">{t("images")}</TabsTrigger>
          <TabsTrigger value="video">{t("videos")}</TabsTrigger>
        </TabsList>

        {["note", "document", "image", "video"].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {getItemsByType(type).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  {getIcon(type)}
                  <p className="text-muted-foreground mt-2">{getEmptyMessage(type)}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getItemsByType(type).map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getIcon(item.type)}
                          <span className="text-sm">{item.title}</span>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                      <p className="text-sm line-clamp-3">{item.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
