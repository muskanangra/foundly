import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

const SECTIONS = [
  { id: 'hero',      label: 'index.page'    },
  { id: 'statement', label: 'statement.section' },
  { id: 'problem',   label: 'problem.section'   },
  { id: 'how',       label: 'how.section'   },
  { id: 'stats',     label: 'stats.section' },
  { id: 'privacy',   label: 'privacy.section'   },
  { id: 'cta',       label: 'join.section'  },
]

export function SectionIndicator() {
  const [active, setActive] = useState(SECTIONS[0].id)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-50% 0px -49% 0px' },
    )

    for (const { id } of SECTIONS) {
      const el = document.getElementById(id)
      if (el) observerRef.current.observe(el)
    }

    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <div
      aria-hidden="true"
      className="sticky top-0 z-30 w-full border-b border-line bg-surface/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-6 py-2 no-scrollbar">
        {SECTIONS.map(({ id, label }) => (
          <span
            key={id}
            className={clsx(
              'shrink-0 font-mono text-[0.55rem] uppercase tracking-[0.18em] transition-colors duration-200',
              active === id ? 'text-accent' : 'text-ink-soft/40',
            )}
          >
            {active === id ? `• ${label}` : label}
          </span>
        ))}
      </div>
    </div>
  )
}
