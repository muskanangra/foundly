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
      aria-label="Call to action"
      className="bg-navy"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center gap-8"
        >
          <h2 className="font-display font-semibold text-ivory leading-tight"
              style={{ fontSize: 'clamp(48px, 7vw, 100px)' }}>
            Find what&apos;s{' '}
            <span className="italic text-[#5B7CB0]">yours.</span>
          </h2>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/feed')}
              className="rounded-full bg-ivory text-navy px-7 py-3.5 font-sans text-[15px] font-medium hover:bg-champagne transition-colors"
            >
              Browse found items
            </button>
            <button
              onClick={() => navigate('/register')}
              className="rounded-full border-[1.5px] border-ivory/60 text-ivory px-7 py-3.5 font-sans text-[15px] font-medium hover:bg-white/10 transition-colors"
            >
              Create an account
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
