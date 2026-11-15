import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface pb-28 pt-10 sm:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <Link to="/" aria-label="Foundly home">
              <Logo />
            </Link>
            <p className="max-w-xs font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft leading-relaxed">
              Lost today. Foundly tomorrow.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex gap-10">
            <ul className="flex flex-col gap-2">
              <li className="font-mono text-[0.55rem] uppercase tracking-widest text-ink-soft/50 mb-1">
                Explore
              </li>
              <li>
                <Link to="/feed" className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft hover:text-accent transition-colors">
                  Browse items
                </Link>
              </li>
              <li>
                <Link to="/post" className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft hover:text-accent transition-colors">
                  Post a find
                </Link>
              </li>
              <li>
                <Link to="/register" className="font-mono text-[0.6rem] uppercase tracking-widest text-ink-soft hover:text-accent transition-colors">
                  Create account
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col gap-1">
            <p className="font-mono text-[0.55rem] uppercase tracking-widest text-ink-soft/50 mb-2">
              A JUIT DS Lab Project
            </p>
            <p className="font-mono text-[0.6rem] text-ink-soft">Muskan Angra</p>
            <p className="font-mono text-[0.6rem] text-ink-soft">Mannat Marwaha</p>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="font-mono text-[0.55rem] uppercase tracking-widest text-ink-soft/50">
            © {YEAR} Foundly · JUIT
          </p>
        </div>
      </div>
    </footer>
  )
}
