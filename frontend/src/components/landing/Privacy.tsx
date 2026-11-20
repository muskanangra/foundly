import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

const points = [
  {
    title: 'No public contact info',
    desc: 'Your email and phone are never shared. Chat happens inside Foundly only.',
  },
  {
    title: 'Identity revealed only by choice',
    desc: "The finder's name appears only after you click Contact Finder — not in the listings.",
  },
  {
    title: 'You stay anonymous until you act',
    desc: 'Browsing and searching never reveals who you are to anyone.',
  },
]

export function Privacy() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <section
      id="privacy"
      ref={ref}
      aria-label="Privacy promise"
      className="bg-champagne"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="grid gap-16 md:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-[40px] md:text-[52px] font-semibold text-navy leading-tight">
              Your name stays private{' '}
              <span className="italic text-sapphire">until you say so.</span>
            </h2>
          </motion.div>

          <div className="flex flex-col gap-8">
            {points.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="flex gap-4"
              >
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sapphire/40" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-[22px] font-semibold text-navy mb-1">{p.title}</h3>
                  <p className="font-sans text-base text-sapphire/70 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
