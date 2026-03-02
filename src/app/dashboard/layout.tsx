

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { ThemeSwatches } from "@/components/theme/ThemeSwatches";
import { CreditsModal } from "@/components/CreditsModal";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { DynamicBreadcrumb } from "@/components/navigation/DynamicBreadcrumb";
import { Footer } from "@/components/Footer";
import { ProfileCompletionCheck } from "@/components/profile/ProfileCompletionCheck";



export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (

    <SidebarProvider>
      <ProfileCompletionCheck />
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 w-full items-center gap-2 bg-background text-foreground border-b group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 sm:mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <ThemeSwatches />
              <ModeToggle />
              <CreditsModal />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 pt-0 min-h-[calc(100vh-4rem)]">
          {children}
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>

  );
}
