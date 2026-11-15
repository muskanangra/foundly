import { clsx } from 'clsx'

interface LogoProps {
  className?: string
  iconOnly?: boolean
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <span className={clsx('inline-flex items-center gap-2 select-none', className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="7" height="7" fill="var(--color-accent)" />
        <rect x="13" y="4" width="7" height="7" fill="var(--color-accent)" opacity="0.5" />
        <rect x="4" y="13" width="7" height="7" fill="var(--color-accent)" opacity="0.5" />
        <rect x="13" y="13" width="7" height="7" fill="var(--color-accent)" />
      </svg>
      {!iconOnly && (
        <span className="font-mono text-xs font-bold tracking-wider text-ink uppercase">
          Foundly
        </span>
      )}
    </span>
  )
}
