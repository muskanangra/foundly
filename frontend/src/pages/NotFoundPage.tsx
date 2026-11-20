import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <span
        aria-hidden="true"
        className="font-display text-[8rem] font-semibold italic leading-none text-champagne select-none sm:text-[12rem]"
        style={{ WebkitTextStroke: '2px var(--color-navy)' }}
      >
        404
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] font-semibold italic text-navy leading-tight">
          Page not found
        </h1>
        <p className="max-w-sm font-sans text-base text-sapphire/70 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button variant="primary" size="md" onClick={() => navigate('/')}>
        Back home
      </Button>
    </div>
  )
}
