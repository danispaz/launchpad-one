import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-glow pointer-events-none" />
        <div className="relative flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
