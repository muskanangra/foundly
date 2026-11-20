import { clsx } from 'clsx'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onDark?: boolean
}

export function Logo({ className, size = 'md', onDark = false }: LogoProps) {
  const sizeClass = {
    sm: 'text-[20px]',
    md: 'text-[24px]',
    lg: 'text-[32px]',
  }[size]

  return (
    <span className={clsx('inline-flex items-center gap-1 select-none', className)}>
      <span
        className={clsx(
          'font-display font-semibold italic leading-none',
          sizeClass,
          onDark ? 'text-ivory' : 'text-navy',
        )}
      >
        Foundly
      </span>
      <span
        className="text-sapphire font-sans text-[8px] leading-none"
        style={{ marginBottom: '2px' }}
        aria-hidden="true"
      >
        ●
      </span>
    </span>
  )
}
