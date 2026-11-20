import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

/* Mini UI vignettes */
function MiniPostVignette() {
  return (
    <div className="bg-ivory rounded-xl p-3 border border-taupe/40 text-left" aria-hidden="true">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-champagne border border-taupe/40" />
        <div className="flex flex-col gap-1">
          <div className="h-2 w-20 rounded bg-champagne" />
          <div className="h-1.5 w-14 rounded bg-champagne/60" />
        </div>
      </div>
      <div className="flex gap-1">
        <span className="text-xs font-sans bg-champagne text-sapphire rounded-full px-2 py-0.5">Library</span>
        <span className="text-xs font-sans bg-champagne text-sapphire rounded-full px-2 py-0.5">Bags</span>
      </div>
    </div>
  )
}

function MiniSearchVignette() {
  return (
    <div className="bg-ivory rounded-xl p-3 border border-taupe/40" aria-hidden="true">
      <div className="flex items-center gap-2 bg-ivory rounded-full border border-taupe/40 px-2 py-1 mb-2">
        <div className="h-2 w-2 rounded-full bg-sapphire/30" />
        <span className="font-sans text-xs text-sapphire/60">wal</span>
        <div className="h-1.5 w-1 bg-sapphire rounded-full animate-pulse" />
      </div>
      <div className="bg-champagne rounded-xl px-2 py-1">
        <span className="font-sans text-xs text-navy font-medium">Wallet</span>
        <span className="font-sans text-xs text-sapphire/70"> · Library</span>
      </div>
    </div>
  )
}

function MiniChatVignette() {
  return (
    <div className="flex flex-col gap-2 p-3" aria-hidden="true">
      <div className="flex justify-start">
        <div className="bg-champagne rounded-2xl rounded-tl px-3 py-1.5">
          <span className="font-sans text-xs text-navy">Is this your wallet?</span>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-navy rounded-2xl rounded-tr px-3 py-1.5">
          <span className="font-sans text-xs text-ivory">Yes! Where are you?</span>
        </div>
      </div>
    </div>
  )
}

function MiniReturnVignette() {
  return (
    <div className="flex items-center justify-center p-4" aria-hidden="true">
      <div className="rounded-full border-[1.5px] border-success bg-success/10 px-4 py-2">
        <span className="font-sans text-sm font-medium text-success">Returned ✓</span>
      </div>
    </div>
  )
}

const steps = [
  {
    num: '01',
    title: 'Finder posts the item',
    desc: 'A finder photographs the item and posts it with a description.',
    vignette: <MiniPostVignette />,
  },
  {
    num: '02',
    title: 'You search the feed',
    desc: 'Browse or search every found item on campus by category and date.',
    vignette: <MiniSearchVignette />,
  },
  {
    num: '03',
    title: 'Chat with the finder',
    desc: 'Log in and click Contact Finder. A private chat opens — no phone numbers.',
    vignette: <MiniChatVignette />,
  },
  {
    num: '04',
    title: 'Item returned, post closed',
    desc: 'Once returned, the finder marks the post as closed. Done.',
    vignette: <MiniReturnVignette />,
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <section
      id="how"
      ref={ref}
      aria-label="How Foundly works"
      className="bg-champagne"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <h2 className="font-display text-[40px] md:text-[52px] font-semibold text-navy leading-tight mb-14">
          From lost to found, in four steps.
        </h2>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div
            className="absolute top-10 left-0 right-0 hidden h-px bg-taupe/40 md:block overflow-hidden"
            aria-hidden="true"
          >
            {inView && (
              <div
                ref={lineRef}
                className="h-px bg-sapphire/40 line-draw"
              />
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
                className="relative flex flex-col gap-4"
              >
                {/* Number node */}
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-ivory border border-taupe/40">
                  <span className="font-display italic text-sapphire text-[32px] font-semibold leading-none">
                    {step.num}
                  </span>
                </div>

                {/* Vignette */}
                <div className="rounded-2xl bg-ivory border border-taupe/40 overflow-hidden min-h-[72px]">
                  {step.vignette}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-[22px] font-semibold text-navy leading-snug">{step.title}</h3>
                  <p className="font-sans text-sm text-sapphire/70 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
