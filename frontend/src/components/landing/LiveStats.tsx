import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { MonoLabel } from '../ui/MonoLabel'
import { Skeleton } from '../ui/Loader'
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

interface StatCardProps {
  label: string
  value: number | null
  status: LoadState
}

function StatCard({ label, value, status }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useCountUp(inView && status === 'success' ? value : null)

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3 rounded-[10px] border border-line bg-surface p-8"
    >
      <MonoLabel>{label}</MonoLabel>
      {status === 'loading' && (
        <>
          <Skeleton className="h-14 w-32" />
          <Skeleton className="h-3 w-20" />
        </>
      )}
      {status === 'success' && value !== null && (
        <span
          className="font-display text-6xl font-black text-ink md:text-7xl"
          aria-label={`${count} ${label.toLowerCase()}`}
        >
          {count.toLocaleString()}
        </span>
      )}
      {status === 'error' && (
        <div className="flex flex-col gap-1">
          <span className="font-display text-6xl font-black text-ink-soft/40 md:text-7xl">
            —
          </span>
          <p className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft/50">
            Awaiting Data
          </p>
        </div>
      )}
    </div>
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
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-10 flex flex-col gap-3"
      >
        <MonoLabel>By the numbers</MonoLabel>
        <h2 className="text-2xl font-semibold text-ink md:text-3xl">
          A community growing every day.
        </h2>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active listings"  value={stats?.active_items ?? null}  status={status} />
        <StatCard label="Items returned"   value={stats?.returned_items ?? null} status={status} />
        <StatCard label="Members"          value={stats?.users ?? null}          status={status} />
      </div>
    </section>
  )
}
