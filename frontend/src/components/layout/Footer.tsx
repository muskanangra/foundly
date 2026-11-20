import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="bg-champagne border-t border-taupe/40">
      <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-10">
        <div className="mb-12">
          <Logo size="lg" />
          <p className="mt-3 text-base text-sapphire/70 font-sans max-w-xs leading-relaxed">
            Every item found on campus, in one place.
          </p>
        </div>

        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between border-t border-navy/10 pt-10">
          <nav aria-label="Footer navigation" className="flex gap-12">
            <ul className="flex flex-col gap-3">
              <li className="font-sans text-sm font-semibold text-navy/70 mb-1">Explore</li>
              <li>
                <Link to="/feed" className="font-sans text-base text-sapphire hover:text-navy transition-colors">
                  Browse items
                </Link>
              </li>
              <li>
                <Link to="/post" className="font-sans text-base text-sapphire hover:text-navy transition-colors">
                  Post a find
                </Link>
              </li>
              <li>
                <Link to="/register" className="font-sans text-base text-sapphire hover:text-navy transition-colors">
                  Create account
                </Link>
              </li>
            </ul>

            <ul className="flex flex-col gap-3">
              <li className="font-sans text-sm font-semibold text-navy/70 mb-1">Account</li>
              <li>
                <Link to="/my-posts" className="font-sans text-base text-sapphire hover:text-navy transition-colors">
                  My posts
                </Link>
              </li>
              <li>
                <Link to="/chats" className="font-sans text-base text-sapphire hover:text-navy transition-colors">
                  Chats
                </Link>
              </li>
              <li>
                <Link to="/alerts" className="font-sans text-base text-sapphire hover:text-navy transition-colors">
                  My alerts
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col gap-2">
            <p className="font-sans text-sm font-semibold text-navy/70 mb-1">A JUIT Data Structures Lab Project</p>
            <p className="font-sans text-base text-sapphire">Muskan Angra</p>
            <p className="font-sans text-base text-sapphire">Mannat Marwaha</p>
          </div>
        </div>

        <div className="mt-10 border-t border-navy/10 pt-6">
          <p className="font-sans text-sm text-sapphire/60">
            © {YEAR} Foundly · JUIT
          </p>
        </div>
      </div>
    </footer>
  )
}

export function SlimFooter() {
  return (
    <footer className="border-t border-taupe/40 bg-ivory">
      <div className="mx-auto max-w-[1200px] px-6 py-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="font-display italic text-navy text-[15px]">Foundly</span>
        <span className="text-taupe/60 select-none">·</span>
        <span className="font-sans text-sm text-sapphire/70">A JUIT DS Lab Project</span>
        <span className="text-taupe/60 select-none">·</span>
        <span className="font-sans text-sm text-sapphire/70">© {YEAR}</span>
      </div>
    </footer>
  )
}
