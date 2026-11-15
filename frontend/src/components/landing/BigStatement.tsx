import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import { CrosshairFrame } from '../ui/CrosshairFrame'

export function BigStatement() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-20% 0px' })

  return (
    <section
      id="statement"
      ref={ref}
      aria-label="Foundly tagline"
      className="flex min-h-[50vh] items-center justify-center overflow-hidden px-6 py-24 bg-surface"
    >
      <CrosshairFrame size={24} className="w-full max-w-5xl">
        <div className="flex flex-col items-center gap-2 text-center px-10 py-8">
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="font-display text-5xl font-black uppercase leading-none tracking-tight text-ink sm:text-6xl md:text-7xl lg:text-8xl"
          >
            LOST TODAY.
          </motion.h2>
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="font-display text-5xl font-black uppercase leading-none tracking-tight text-accent sm:text-6xl md:text-7xl lg:text-8xl"
          >
            FOUNDLY TOMORROW.
          </motion.h2>
        </div>
      </CrosshairFrame>
    </section>
  )
}
