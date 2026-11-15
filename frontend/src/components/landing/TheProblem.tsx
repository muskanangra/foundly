import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { MonoLabel } from '../ui/MonoLabel'

const problems = [
  {
    num: '01',
    title: 'Buried in group chats',
    desc: 'Lost-and-found posts drown in hundreds of unrelated messages.',
  },
  {
    num: '02',
    title: 'No way to search',
    desc: "You can't filter by category, date or location in a chat.",
  },
  {
    num: '03',
    title: 'No safe way to reach the finder',
    desc: 'Sharing phone numbers publicly puts everyone at risk.',
  },
]

export function TheProblem() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <section
      id="problem"
      ref={ref}
      aria-label="The problem with current lost-and-found"
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <div className="mb-10 flex flex-col gap-3">
        <MonoLabel>The Problem</MonoLabel>
        <h2 className="text-2xl font-semibold text-ink md:text-3xl">
          Current methods break down.
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {problems.map((p, i) => (
          <motion.div
            key={p.num}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
            className="rounded-[10px] border border-line bg-surface p-6"
          >
            <div className="mb-4">
              <span className="font-mono text-xs font-semibold text-accent tracking-widest">{p.num}</span>
            </div>
            <h3 className="text-sm font-semibold text-ink mb-2">{p.title}</h3>
            <p className="text-sm text-ink-soft leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
