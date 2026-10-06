import { Link } from 'react-router-dom'

interface PlaceholderProps {
  path: string
}

export default function Placeholder({ path }: PlaceholderProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-xs text-neutral-500">swentra@vault:~$</p>
      <h1 className="text-lg text-neutral-200">{path}</h1>
      <p className="text-sm text-neutral-500">
        Phase 0 scaffold — route placeholder.
      </p>
      <Link className="text-sm text-[#00FF66] underline" to="/">
        return to /
      </Link>
    </main>
  )
}
