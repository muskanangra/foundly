import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

const problems = [
  {
    num: '01',
    title: 'Buried in group chats',
    desc: 'Lost-and-found posts drown in hundreds of unrelated messages.',
  },
  {
    num: '02',
    title: 'Impossible to search',
    desc: "You can't filter by category, date or location in a chat.",
  },
  {
    num: '03',
    title: 'No safe way to reach the finder',
    desc: 'Sharing phone numbers publicly puts everyone at risk.',
  },
]

/* Animated chat illustration */
const chatBubbles = [
  { text: 'Anyone seen a blue bottle?', mine: false },
  { text: 'Who took my charger', mine: true },
  { text: 'Found keys near the mess 🗝️', mine: false },
  { text: 'Lost my ID card!!', mine: true },
  { text: 'Class cancelled btw', mine: false },
  { text: 'Found a wallet near the library', mine: false, highlight: true },
  { text: 'Is the lab open today?', mine: true },
  { text: 'My laptop charger is missing', mine: false },
]

function GroupChatIllustration() {
  return (
    <div
      className="relative w-full max-w-[280px] mx-auto rounded-[32px] bg-champagne border-2 border-taupe/50 overflow-hidden shadow-xl"
      style={{ aspectRatio: '9 / 16' }}
      aria-hidden="true"
    >
      {/* Phone header */}
      <div className="bg-navy px-4 py-3 flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-ivory/20 flex items-center justify-center">
          <span className="font-sans text-xs text-ivory font-medium">JU</span>
        </div>
        <span className="font-sans text-sm text-ivory/80 font-medium">JUIT 2024 Batch</span>
      </div>

      {/* Scrolling messages */}
      <div className="relative overflow-hidden" style={{ height: 'calc(100% - 56px)' }}>
        <div
          className="flex flex-col gap-2 px-3 py-3"
          style={{ animation: 'phone-scroll 12s linear infinite' }}
        >
          {[...chatBubbles, ...chatBubbles].map((b, i) => (
            <div
              key={i}
              className={`flex ${b.mine ? 'justify-end' : 'justify-start'}`}
            >
              <span
                className={`text-xs leading-snug px-2.5 py-1.5 rounded-xl font-sans max-w-[82%] ${
                  b.highlight
                    ? 'bg-navy/80 text-ivory font-medium'
                    : b.mine
                      ? 'bg-sapphire/30 text-navy'
                      : 'bg-ivory text-navy'
                }`}
              >
                {b.text}
                {b.highlight && (
                  <span className="ml-1 opacity-50">↑ buried</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TheProblem() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <section
      id="problem"
      ref={ref}
      aria-label="The problem with current lost-and-found"
      className="bg-ivory"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        <div className="grid gap-16 md:grid-cols-2 items-center">
          {/* Left: editorial list */}
          <div>
            <h2 className="font-display text-[40px] md:text-[52px] font-semibold text-navy leading-tight mb-10">
              Lost things don't belong in group chats.
            </h2>

            <div className="flex flex-col gap-8">
              {problems.map((p, i) => (
                <motion.div
                  key={p.num}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
                  className="flex gap-6 items-start"
                >
                  <span
                    className="font-display italic text-sapphire shrink-0 leading-none"
                    style={{ fontSize: '80px', lineHeight: 0.85, opacity: 0.35 }}
                    aria-hidden="true"
                  >
                    {p.num}
                  </span>
                  <div className="pt-2">
                    <h3 className="font-display text-[26px] font-semibold text-navy mb-1">{p.title}</h3>
                    <p className="font-sans text-base text-sapphire/70 leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: chat illustration */}
          <motion.div
            className="flex justify-center items-start"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GroupChatIllustration />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
