import { AppSidebar } from "./AppSidebar";
import { PermissionsProvider } from "@/lib/usePermissions";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <div className="min-h-screen flex bg-background text-foreground selection:bg-foreground/5">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col">{children}</div>
        </div>
      </div>
    </PermissionsProvider>
  );
}
