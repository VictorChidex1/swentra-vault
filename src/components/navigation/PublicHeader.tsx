import { useState, useEffect } from "react";
import { LogOutIcon, Menu } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { label: "About", to: "/about" },
  { label: "Security", to: "/security" },
];

export function PublicHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    // Initialize state
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-background/60 backdrop-blur-xl shadow-sm"
          : "bg-transparent",
      )}
    >
      {/* Animated Bottom Border (Laser) */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-[1px] w-full transition-colors duration-500",
          isScrolled ? "bg-border/50" : "bg-transparent",
        )}
      >
        <AnimatePresence>
          {isScrolled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute left-0 top-0 h-full w-full overflow-hidden"
            >
              <motion.div
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                animate={{ x: ["-100%", "300%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <img
            src="/assets/swentra-vault-logo-256.png"
            alt="Swentra Vault"
            className="size-8 rounded-md"
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-foreground">
            SWENTRA VAULT
          </span>
        </Link>

        <nav
          className="ml-auto hidden items-center gap-1 md:flex relative z-10"
          onMouseLeave={() => setHoveredPath(null)}
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onMouseEnter={() => setHoveredPath(link.to)}
              className={({ isActive }) =>
                cn(
                  "relative rounded-md px-4 py-2 text-sm transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {hoveredPath === link.to && (
                    <motion.div
                      layoutId="header-nav-indicator"
                      className="absolute inset-0 z-[-1] rounded-md bg-white/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.5,
                      }}
                    />
                  )}
                  {/* Subtle active indicator dot */}
                  {isActive && (
                    <motion.div
                      layoutId="header-active-dot"
                      className="absolute -bottom-[2px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-t-full bg-primary"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex relative z-10">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-white/5"
              onClick={() => { signOut(); navigate('/'); }}
            >
              <LogOutIcon className="size-4" />
              Sign out
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hover:bg-white/5"
              >
                <Link to="/login">Access your account</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="shadow-[0_0_20px_rgba(0,255,102,0.1)] transition-shadow hover:shadow-[0_0_25px_rgba(0,255,102,0.25)]"
              >
                <Link to="/register">Open an account</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet>
          <SheetTrigger
            className="ml-auto rounded-md p-2 text-muted-foreground md:hidden relative z-10 hover:bg-white/5"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-72 border-border bg-surface/95 backdrop-blur-xl p-0"
          >
            <SheetHeader className="border-b border-border/50 px-5 py-4">
              <SheetTitle className="text-sm tracking-[0.18em] text-foreground">
                SWENTRA VAULT
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-3 py-4">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      cn(
                        "rounded-md px-3 py-2 text-sm transition-all",
                        isActive
                          ? "bg-white/10 text-foreground border-l-2 border-primary"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-l-2 border-transparent",
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </SheetClose>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-border/50 px-5 py-4">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="bg-transparent hover:bg-white/5"
                onClick={() => { signOut(); navigate('/'); }}
              >
                <LogOutIcon className="size-4" />
                Sign out
              </Button>
            ) : (
              <>
                <SheetClose asChild>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:bg-white/5"
                  >
                    <Link to="/login">Access your account</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild size="sm">
                    <Link to="/register">Open an account</Link>
                  </Button>
                </SheetClose>
              </>
            )}
          </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
