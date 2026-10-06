import { NavLink, useNavigate } from 'react-router-dom'
import { LogOutIcon } from 'lucide-react'

import { CUSTOMER_NAV } from '@/components/navigation/nav-items'
import { TerminalStatus } from '@/components/terminal/TerminalStatus'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <aside
      className={cn(
        'flex w-64 shrink-0 flex-col border-r border-border bg-surface',
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <img
          src="/assets/swentra-vault-logo-256.png"
          alt="Swentra Vault"
          className="size-8 rounded-md"
        />
        <span className="text-sm font-semibold tracking-[0.18em] text-foreground">
          SWENTRA VAULT
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        <ul className="space-y-1">
          {CUSTOMER_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'text-xs',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {item.index}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border px-5 py-4 space-y-2">
        <p className="mb-2 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
          {user ? 'Signed in' : 'Secure session'}
        </p>
        {user ? (
          <>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            <TerminalStatus
              label={user.emailVerified ? 'Verified' : 'Email not verified'}
              tone={user.emailVerified ? 'success' : 'warning'}
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOutIcon className="size-4" />
              Sign out
            </Button>
          </>
        ) : (
          <TerminalStatus label="Not signed in" tone="muted" />
        )}
      </div>
    </aside>
  )
}
