import { Link } from 'react-router-dom'

interface PlaceholderProps {
  path: string
  label?: string
}

export default function Placeholder({ path, label }: PlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-[40svh] max-w-2xl flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
        Swentra Vault
      </p>
      <h1 className="text-lg text-foreground">{label ?? path}</h1>
      <p className="text-sm text-muted-foreground">
        This page arrives in a later phase.
      </p>
      <Link to="/" className="text-sm text-primary underline">
        Back to home
      </Link>
    </div>
  )
}
