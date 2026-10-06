import { Menu } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Security', to: '/security' },
]

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/swentra-vault-logo-256.png"
            alt="Swentra Vault"
            className="size-8 rounded-md"
          />
          <span className="text-sm font-semibold tracking-[0.18em] text-foreground">
            SWENTRA VAULT
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Access your account</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/register">Open an account</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger
            className="ml-auto rounded-md p-2 text-muted-foreground md:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-border bg-surface p-0">
            <SheetHeader className="border-b border-border px-5 py-4">
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
                        'rounded-md px-3 py-2 text-sm',
                        isActive
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </SheetClose>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
              <SheetClose asChild>
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Access your account</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild size="sm">
                  <Link to="/register">Open an account</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
