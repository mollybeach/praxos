import { ProfilePage } from "@/components/pages/ProfilePage"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { AppHeader } from "@/components/dashboard/app-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function Profile() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background dark">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <AppHeader title="Profile" />
          <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <ProfilePage />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

