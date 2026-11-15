import { SectionIndicator } from '../components/landing/SectionIndicator'
import { Hero } from '../components/landing/Hero'
import { BigStatement } from '../components/landing/BigStatement'
import { TheProblem } from '../components/landing/TheProblem'
import { HowItWorks } from '../components/landing/HowItWorks'
import { LiveStats } from '../components/landing/LiveStats'
import { Privacy } from '../components/landing/Privacy'
import { CallToAction } from '../components/landing/CallToAction'

export default function LandingPage() {
  return (
    <>
      <SectionIndicator />
      <Hero />
      <BigStatement />
      <TheProblem />
      <HowItWorks />
      <LiveStats />
      <Privacy />
      <CallToAction />
    </>
  )
}
