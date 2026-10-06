import { ArrowLeftRight, Clock, Home, Menu, Wallet } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { CUSTOMER_NAV } from '@/components/navigation/nav-items'
import { TerminalStatus } from '@/components/terminal/TerminalStatus'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const PRIMARY = [
  { label: 'Overview', to: '/app', icon: Home, end: true },
  { label: 'Accounts', to: '/app/accounts', icon: Wallet, end: false },
  { label: 'Transfer', to: '/app/transfer', icon: ArrowLeftRight, end: false },
  { label: 'Activity', to: '/app/transactions', icon: Clock, end: false },
]

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-surface/95 backdrop-blur',
        className,
      )}
      aria-label="Primary"
    >
      {PRIMARY.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <item.icon className="size-4" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}

      <Sheet>
        <SheetTrigger
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] text-muted-foreground"
          aria-label="More navigation"
        >
          <Menu className="size-4" aria-hidden="true" />
          More
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-border bg-surface p-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="text-sm tracking-[0.18em] text-foreground">
              SWENTRA VAULT
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-3 py-4">
            {CUSTOMER_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )
                }
              >
                <span className="text-xs text-muted-foreground">
                  {item.index}
                </span>
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="border-t border-border px-5 py-4">
            <p className="mb-2 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
              Secure session
            </p>
            <TerminalStatus label="Not signed in" tone="muted" />
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
