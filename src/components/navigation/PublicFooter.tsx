import { Link } from 'react-router-dom'

interface FooterLink {
  label: string
  to: string
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Security', to: '/security' },
]

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]

const ACCOUNT_LINKS: FooterLink[] = [
  { label: 'Access your account', to: '/login' },
  { label: 'Open an account', to: '/register' },
]

const YEAR = new Date().getFullYear()

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: FooterLink[]
}) {
  return (
    <div>
      <h3 className="mb-3 text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <img
                src="/assets/swentra-vault-logo-256.png"
                alt="Swentra Vault"
                className="size-8 rounded-md"
              />
              <span className="text-sm font-semibold tracking-[0.18em] text-foreground">
                SWENTRA VAULT
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Private banking, engineered for modern finance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <FooterColumn title="Product" links={PRODUCT_LINKS} />
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
            <FooterColumn title="Account" links={ACCOUNT_LINKS} />
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
          Swentra Vault is a banking technology prototype and simulated financial
          environment. Transactions, balances, KYC verification and settlement
          shown in this demonstration are simulated and do not represent real
          banking services or regulated financial activity.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          &copy; {YEAR} Swentra Vault. Prototype demonstration.
        </p>
      </div>
    </footer>
  )
}
