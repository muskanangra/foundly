/* Decorative wrapper that draws "+" corner marks around its children */
import { clsx } from 'clsx'

interface CrosshairFrameProps {
  children: React.ReactNode
  className?: string
  /** Size of the crosshair arms in px */
  size?: number
}

export function CrosshairFrame({ children, className, size = 16 }: CrosshairFrameProps) {
  const arm = size

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)}>
      {/* Top-left */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0"
        style={{ width: arm, height: arm }}
      >
        <svg width={arm} height={arm} viewBox={`0 0 ${arm} ${arm}`} fill="none">
          <line x1={arm / 2} y1="0" x2={arm / 2} y2={arm / 2 - 1} stroke="var(--color-accent)" strokeWidth="1" />
          <line x1="0" y1={arm / 2} x2={arm / 2 - 1} y2={arm / 2} stroke="var(--color-accent)" strokeWidth="1" />
        </svg>
      </span>
      {/* Top-right */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0"
        style={{ width: arm, height: arm }}
      >
        <svg width={arm} height={arm} viewBox={`0 0 ${arm} ${arm}`} fill="none">
          <line x1={arm / 2} y1="0" x2={arm / 2} y2={arm / 2 - 1} stroke="var(--color-accent)" strokeWidth="1" />
          <line x1={arm} y1={arm / 2} x2={arm / 2 + 1} y2={arm / 2} stroke="var(--color-accent)" strokeWidth="1" />
        </svg>
      </span>
      {/* Bottom-left */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0"
        style={{ width: arm, height: arm }}
      >
        <svg width={arm} height={arm} viewBox={`0 0 ${arm} ${arm}`} fill="none">
          <line x1={arm / 2} y1={arm} x2={arm / 2} y2={arm / 2 + 1} stroke="var(--color-accent)" strokeWidth="1" />
          <line x1="0" y1={arm / 2} x2={arm / 2 - 1} y2={arm / 2} stroke="var(--color-accent)" strokeWidth="1" />
        </svg>
      </span>
      {/* Bottom-right */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0"
        style={{ width: arm, height: arm }}
      >
        <svg width={arm} height={arm} viewBox={`0 0 ${arm} ${arm}`} fill="none">
          <line x1={arm / 2} y1={arm} x2={arm / 2} y2={arm / 2 + 1} stroke="var(--color-accent)" strokeWidth="1" />
          <line x1={arm} y1={arm / 2} x2={arm / 2 + 1} y2={arm / 2} stroke="var(--color-accent)" strokeWidth="1" />
        </svg>
      </span>
      {children}
    </div>
  )
}
