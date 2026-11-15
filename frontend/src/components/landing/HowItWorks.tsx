import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { MonoLabel } from '../ui/MonoLabel'

const steps = [
  {
    num: '01',
    title: 'Finder posts the item',
    desc: 'A finder photographs the found item and posts it with a description.',
  },
  {
    num: '02',
    title: 'You search the feed',
    desc: 'Browse or filter every found item on campus by category and date.',
  },
  {
    num: '03',
    title: 'Contact the finder privately',
    desc: 'Log in and click Contact Finder. A private chat opens — no phone numbers shared.',
  },
  {
    num: '04',
    title: 'Item returned, post closed',
    desc: 'Once returned, the finder marks the post as closed. Done.',
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <section
      id="how"
      ref={ref}
      aria-label="How Foundly works"
      className="border-t border-line bg-surface"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex flex-col gap-3">
          <MonoLabel>How it works</MonoLabel>
          <h2 className="text-2xl font-semibold text-ink md:text-3xl">
            Four steps from lost to found.
          </h2>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            aria-hidden="true"
            className="absolute top-5 left-0 right-0 hidden h-px bg-line md:block"
          />

          <div className="grid gap-10 md:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                className="relative flex flex-col gap-4"
              >
                {/* Number node */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-[5px] border border-line bg-surface">
                  <span className="font-mono text-xs font-bold text-accent tracking-widest">
                    {step.num}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
