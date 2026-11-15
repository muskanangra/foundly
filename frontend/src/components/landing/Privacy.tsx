import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { MonoLabel } from '../ui/MonoLabel'

const points = [
  {
    title: 'Finders stay anonymous',
    desc: 'Finder names are hidden from the public feed. No one can identify who posted what.',
  },
  {
    title: 'Names revealed only to claimants',
    desc: "The finder's name appears only after a logged-in user clicks “Contact Finder” on a specific item.",
  },
  {
    title: 'Phone numbers are never shared',
    desc: "All communication happens through Foundly's private in-app chat. No personal contact details exchanged.",
  },
]

export function Privacy() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <section
      id="privacy"
      ref={ref}
      aria-label="Privacy model"
      className="border-t border-line bg-surface"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col gap-3"
        >
          <MonoLabel>Privacy first</MonoLabel>
          <h2 className="text-2xl font-semibold text-ink md:text-3xl">
            Your safety is built in.
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-sm bg-accent shrink-0" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-ink">{p.title}</h3>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed pl-4">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
