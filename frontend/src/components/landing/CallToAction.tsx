import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'motion/react'

export function CallToAction() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const navigate = useNavigate()

  return (
    <section
      id="cta"
      ref={ref}
      aria-label="Call to action — find what's yours"
      className="bg-accent"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center gap-8"
        >
          <h2 className="font-display text-5xl font-black uppercase leading-none tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            FIND WHAT&apos;S YOURS.
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/feed')}
              className="inline-flex items-center rounded-[5px] bg-white px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-ink hover:bg-surface-2 transition-colors"
            >
              Browse Found Items
            </button>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center rounded-[5px] border border-white px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
            >
              Create an Account
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
