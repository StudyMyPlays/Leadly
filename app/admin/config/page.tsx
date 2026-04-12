"use client"

import { useRouter } from "next/navigation"
import AdminConfigPanel, { type DashboardConfig } from "@/components/admin/AdminConfigPanel"

export default function AdminConfigPage() {
  const router = useRouter()

  const handlePreview = (config: DashboardConfig) => {
    // Store config in sessionStorage and navigate to preview
    sessionStorage.setItem("previewConfig", JSON.stringify(config))
    router.push("/admin/preview")
  }

  const handleBack = () => {
    router.push("/")
  }

  return <AdminConfigPanel onPreview={handlePreview} onBack={handleBack} />
}
