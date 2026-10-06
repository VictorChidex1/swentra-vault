import type { ReactNode } from 'react'

interface DocSectionProps {
  title: string
  children: ReactNode
}

/** A titled block of prose used on informational public pages. */
export function DocSection({ title, children }: DocSectionProps) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-xs tracking-[0.2em] text-foreground uppercase">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}
