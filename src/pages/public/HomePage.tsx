import { AccountPreview } from '@/components/home/AccountPreview'
import { Disclaimer } from '@/components/home/Disclaimer'
import { FinalCta } from '@/components/home/FinalCta'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { MultiCurrency } from '@/components/home/MultiCurrency'
import { Pricing } from '@/components/home/Pricing'
import { SecureTransfers } from '@/components/home/SecureTransfers'
import { Security } from '@/components/home/Security'

export default function HomePage() {
  return (
    <>
      <Hero />
      <AccountPreview />
      <MultiCurrency />
      <SecureTransfers />
      <Pricing />
      <Security />
      <HowItWorks />
      <Disclaimer />
      <FinalCta />
    </>
  )
}
