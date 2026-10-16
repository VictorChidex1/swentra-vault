import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { primeAdminCache } from "@/hooks/useAdminCache";
import { 
  UsersIcon, 
  ShieldAlertIcon, 
  ArrowRightLeftIcon, 
  BanknoteIcon,
  LogOutIcon,
  SettingsIcon,
  SearchIcon,
  ActivityIcon,
  LandmarkIcon,
  MessagesSquareIcon,
  RotateCcwIcon,
  MenuIcon,
  ExternalLinkIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SystemErrorBoundary } from "@/components/error/SystemErrorBoundary";

const ADMIN_NAVIGATION = [
  { name: "Overview", to: "/admin", icon: ActivityIcon },
  { name: "Users & Accounts", to: "/admin/users", icon: UsersIcon },
  { name: "Treasury Reserve", to: "/admin/treasury", icon: LandmarkIcon },
  { name: "KYC Review", to: "/admin/kyc", icon: ShieldAlertIcon },
  { name: "Support Tickets", to: "/admin/support", icon: MessagesSquareIcon },
  { name: "Transactions", to: "/admin/transactions", icon: ArrowRightLeftIcon },
  { name: "Reversals", to: "/admin/reversals", icon: RotateCcwIcon },
  { name: "Funding Portal", to: "/admin/funding", icon: BanknoteIcon },
  { name: "Global Settings", to: "/admin/settings", icon: SettingsIcon },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Warm the data the Overview + list pages rely on so first paint is served
    // from cache rather than waiting on the network.
    primeAdminCache('dashboard-stats', async () => {
      const getStats = httpsCallable(functions, 'adminGetDashboardStats');
      return (await getStats()).data;
    });
    primeAdminCache('admin-users', async () => {
      const fn = httpsCallable<void, { users: unknown[] }>(functions, 'adminListUsers');
      return (await fn()).data.users;
    });
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-foreground font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-[#0A0A0A] flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary/10 rounded flex items-center justify-center">
              <ShieldAlertIcon className="size-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-white">Vault Admin</span>
          </div>
          <div className="mt-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Command Center
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {ADMIN_NAVIGATION.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="size-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-medium">
              {user?.email?.[0].toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-foreground truncate">
                {user?.email}
              </div>
              <div className="text-xs text-primary font-medium">Super Admin</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOutIcon className="mr-2 size-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-[#0A0A0A] border-r border-border p-0 flex flex-col text-foreground">
          <SheetHeader className="p-5 border-b border-border text-left">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-primary/10 rounded flex items-center justify-center">
                <ShieldAlertIcon className="size-4 text-primary" />
              </div>
              <SheetTitle className="font-bold tracking-tight text-white text-base">Vault Admin</SheetTitle>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-1">
              Command Center
            </p>
          </SheetHeader>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {ADMIN_NAVIGATION.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === "/admin"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground"
                  )
                }
              >
                <item.icon className="size-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="size-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-medium">
                {user?.email?.[0].toUpperCase() || "A"}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-foreground truncate">
                  {user?.email}
                </div>
                <div className="text-[11px] text-primary font-medium">Super Admin</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs border-border"
              onClick={() => {
                setMobileOpen(false);
                navigate("/app");
              }}
            >
              <ExternalLinkIcon className="mr-2 size-3.5" />
              Return to Customer App
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOutIcon className="mr-2 size-3.5" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-14 sm:h-16 border-b border-border bg-[#0A0A0A] flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0">
          {/* Mobile Left: Menu Toggle + Brand */}
          <div className="flex items-center gap-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Open Admin Navigation"
            >
              <MenuIcon className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="size-7 bg-primary/10 rounded flex items-center justify-center">
                <ShieldAlertIcon className="size-3.5 text-primary" />
              </div>
              <span className="font-bold tracking-tight text-white text-sm">Vault Admin</span>
            </div>
          </div>

          {/* Desktop Left: Search Bar */}
          <div className="hidden md:flex items-center gap-2 w-80 lg:w-96 relative">
            <SearchIcon className="size-4 absolute left-3 text-muted-foreground" />
            <Input 
              placeholder="Search users, accounts, or transactions..." 
              className="pl-9 h-9 bg-surface/50 border-border text-sm"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3 border-border hover:bg-surface"
              onClick={() => navigate("/app")}
            >
              <ExternalLinkIcon className="size-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Return to App</span>
              <span className="sm:hidden">App</span>
            </Button>

            {/* Mobile User Avatar Indicator */}
            <div className="size-8 rounded-full bg-surface border border-border flex md:hidden items-center justify-center text-xs font-semibold text-primary">
              {user?.email?.[0].toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* Mobile Quick-Scroll Navigation Strip */}
        <nav 
          aria-label="Admin Sections"
          className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2 border-b border-border bg-[#080808] shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {ADMIN_NAVIGATION.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                  isActive
                    ? "bg-primary text-black font-semibold shadow-xs"
                    : "text-muted-foreground bg-surface/60 border border-border/80 hover:text-foreground hover:bg-surface"
                )
              }
            >
              <item.icon className="size-3.5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#050505]">
          <SystemErrorBoundary level="page">
            <Outlet />
          </SystemErrorBoundary>
        </div>
      </main>
    </div>
  );
}
