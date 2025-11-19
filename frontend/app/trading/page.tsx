import { TradingPage } from "@/components/pages/TradingPage"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AppHeader } from "@/components/dashboard/app-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function Trading() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background dark">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <AppHeader title="Trading" />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <TradingPage />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

