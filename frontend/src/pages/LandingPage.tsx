import { Hero } from '../components/landing/Hero'
import { TheProblem } from '../components/landing/TheProblem'
import { HowItWorks } from '../components/landing/HowItWorks'
import { LiveStats } from '../components/landing/LiveStats'
import { Privacy } from '../components/landing/Privacy'
import { CallToAction } from '../components/landing/CallToAction'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TheProblem />
      <HowItWorks />
      <LiveStats />
      <Privacy />
      <CallToAction />
    </>
  )
}
