import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span
        aria-hidden="true"
        className="font-display text-[8rem] font-black leading-none text-accent select-none sm:text-[12rem]"
      >
        404
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-sm font-semibold uppercase tracking-widest text-ink">
          Page not found
        </h1>
        <p className="max-w-sm text-sm text-ink-soft leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-stretch cursor-pointer rounded-[5px] overflow-hidden border border-accent hover:border-accent-ink transition-colors"
      >
        <span className="flex items-center justify-center self-stretch shrink-0 w-9 bg-accent text-white" aria-hidden="true">+</span>
        <span className="flex items-center justify-center px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent">
          Back Home
        </span>
      </button>
    </div>
  )
}
