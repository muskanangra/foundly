import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PixelImage } from '../ui/PixelImage'
import { Tag } from '../ui/Tag'
import { listItems } from '../../api/items'
import type { Item } from '../../api/types'

export function Hero() {
  const [heroItems, setHeroItems] = useState<Item[]>([])

  useEffect(() => {
    listItems({ page_size: 4, sort: 'newest' })
      .then((r) => setHeroItems(r.items.slice(0, 4)))
      .catch(() => {})
  }, [])

  const tags = heroItems.length > 0 ? heroItems : []

  return (
    <section
      id="hero"
      aria-label="Foundly hero"
      className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="relative overflow-hidden rounded-2xl min-h-[480px] md:min-h-[540px]">
        {/* Background — heavily pixelated */}
        <PixelImage
          src="/hero-campus.jpg"
          pixelSize={16}
          id={42}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Light wash: opaque at top, transparent at bottom */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'linear-gradient(to bottom, rgba(243,246,251,0.92) 0%, rgba(243,246,251,0.18) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-20 flex flex-col h-full min-h-[480px] md:min-h-[540px] p-8 md:p-14">
          {/* Top row */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
            {/* Left: Headline */}
            <div className="flex-1">
              <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-soft mb-4">
                JUIT Lost &amp; Found
              </p>
              <h1 className="font-sans font-light text-5xl sm:text-6xl md:text-6xl lg:text-7xl leading-tight text-ink">
                Lost today.
                <br />
                <span className="text-accent">Foundly</span> tomorrow.
              </h1>
            </div>

            {/* Right: description + buttons */}
            <div className="flex-1 flex flex-col gap-5 md:pt-4 max-w-sm">
              <p className="text-sm text-ink-soft leading-relaxed">
                A campus-wide board where finders post what they found — and you reclaim what's yours.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/feed">
                  <button className="inline-flex items-stretch cursor-pointer rounded-[5px] overflow-hidden border border-accent hover:border-accent-ink transition-colors">
                    <span className="flex items-center justify-center self-stretch shrink-0 w-9 bg-accent text-white" aria-hidden="true">+</span>
                    <span className="flex items-center justify-center px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent">
                      Browse Found Items
                    </span>
                  </button>
                </Link>
                <Link to="/register">
                  <button className="inline-flex items-center rounded-[5px] border border-line bg-surface px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink-soft hover:border-accent hover:text-accent transition-colors">
                    Post a Found Item
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Tags row — lower half */}
          <div className="flex flex-wrap gap-2 justify-end">
            {tags.length > 0
              ? tags.map((item) => (
                  <Tag key={item.id}>
                    ● FOUND · {item.name.toUpperCase().slice(0, 20)}
                  </Tag>
                ))
              : (
                <>
                  <Tag>● YOUR ITEM COULD BE HERE</Tag>
                  <Tag>● YOUR ITEM COULD BE HERE</Tag>
                </>
              )
            }
          </div>
        </div>
      </div>
    </section>
  )
}
