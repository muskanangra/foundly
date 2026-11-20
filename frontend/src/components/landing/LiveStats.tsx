import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { fetchStats, type StatsResponse } from '../../api/stats'

type LoadState = 'loading' | 'success' | 'error'

function useCountUp(target: number | null, duration = 1800) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (target === null) return
    let start: number | null = null
    let frameId: number

    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))
      if (progress < 1) frameId = requestAnimationFrame(step)
    }

    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [target, duration])

  return display
}

interface StatItemProps {
  label: string
  value: number | null
  status: LoadState
  delay?: number
  inView: boolean
}

function StatItem({ label, value, status, delay = 0, inView }: StatItemProps) {
  const count = useCountUp(inView && status === 'success' ? value : null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className="flex flex-col gap-2 py-10 border-t border-navy/10"
    >
      {status === 'loading' && (
        <div className="h-16 w-32 rounded-xl bg-champagne animate-pulse" aria-hidden="true" />
      )}
      {status === 'success' && value !== null && (
        <span
          className="font-display text-[72px] md:text-[96px] font-semibold text-navy leading-none"
          aria-label={`${count} ${label}`}
        >
          {count.toLocaleString()}
        </span>
      )}
      {status === 'error' && (
        <span className="font-display text-[72px] md:text-[96px] font-semibold text-sapphire/30 leading-none">
          —
        </span>
      )}
      <p className="font-sans text-base font-medium text-sapphire">{label}</p>
      {status === 'error' && (
        <p className="font-sans text-sm text-sapphire/50">Waiting for the first finds</p>
      )}
    </motion.div>
  )
}

export function LiveStats() {
  const [status, setStatus] = useState<LoadState>('loading')
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })

  useEffect(() => {
    if (!inView) return
    fetchStats()
      .then((data) => { setStats(data); setStatus('success') })
      .catch(() => setStatus('error'))
  }, [inView])

  return (
    <section
      id="stats"
      ref={ref}
      aria-label="Live Foundly statistics"
      className="bg-ivory"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <h2 className="font-display text-[40px] md:text-[52px] font-semibold text-navy leading-tight mb-4">
          A community growing every day.
        </h2>
        <p className="font-sans text-base text-sapphire/70 mb-10">Live campus numbers, updated in real time.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
          <StatItem label="Active listings"  value={stats?.active_items ?? null}  status={status} delay={0}    inView={inView} />
          <StatItem label="Items returned"   value={stats?.returned_items ?? null} status={status} delay={0.1}  inView={inView} />
          <StatItem label="Members"          value={stats?.users ?? null}          status={status} delay={0.2}  inView={inView} />
        </div>
      </div>
    </section>
  )
}
