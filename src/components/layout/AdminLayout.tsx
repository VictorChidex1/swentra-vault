import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  UsersIcon, 
  ShieldAlertIcon, 
  ArrowRightLeftIcon, 
  BanknoteIcon,
  LogOutIcon,
  SettingsIcon,
  SearchIcon,
  ActivityIcon,
  LandmarkIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ADMIN_NAVIGATION = [
  { name: "Overview", to: "/admin", icon: ActivityIcon },
  { name: "Users & Accounts", to: "/admin/users", icon: UsersIcon },
  { name: "Treasury Reserve", to: "/admin/treasury", icon: LandmarkIcon },
  { name: "KYC Review", to: "/admin/kyc", icon: ShieldAlertIcon },
  { name: "Transactions", to: "/admin/transactions", icon: ArrowRightLeftIcon },
  { name: "Funding Portal", to: "/admin/funding", icon: BanknoteIcon },
  { name: "Global Settings", to: "/admin/settings", icon: SettingsIcon },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-[#0A0A0A] flex flex-col hidden md:flex">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-[#0A0A0A] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 w-96 relative">
            <SearchIcon className="size-4 absolute left-3 text-muted-foreground" />
            <Input 
              placeholder="Search users, accounts, or transactions..." 
              className="pl-9 h-9 bg-surface/50 border-border"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/app")}>
              Return to App
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#050505]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
