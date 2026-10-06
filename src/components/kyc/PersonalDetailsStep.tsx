import type { PersonalDetails } from '@/types/kyc'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PersonalDetailsStepProps {
  data: Partial<PersonalDetails>
  onChange: (data: Partial<PersonalDetails>) => void
}

export function PersonalDetailsStep({
  data,
  onChange,
}: PersonalDetailsStepProps) {
  function update(field: keyof PersonalDetails, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Stage 01 / 04
        </p>
        <h2 className="mt-2 text-xl font-medium text-foreground">
          Personal Information
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please provide your legal name and residential details exactly as they
          appear on your identity document.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-first-name">First Name</Label>
          <Input
            id="kyc-first-name"
            placeholder="Enter your first name"
            value={data.firstName ?? ''}
            onChange={(e) => update('firstName', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-last-name">Last Name</Label>
          <Input
            id="kyc-last-name"
            placeholder="Enter your last name"
            value={data.lastName ?? ''}
            onChange={(e) => update('lastName', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-dob">Date of Birth</Label>
          <Input
            id="kyc-dob"
            type="date"
            value={data.dateOfBirth ?? ''}
            onChange={(e) => update('dateOfBirth', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-nationality">Nationality</Label>
          <Input
            id="kyc-nationality"
            placeholder="e.g. Nigerian"
            value={data.nationality ?? ''}
            onChange={(e) => update('nationality', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-country">Country of Residence</Label>
          <Input
            id="kyc-country"
            placeholder="e.g. Nigeria"
            value={data.countryOfResidence ?? ''}
            onChange={(e) => update('countryOfResidence', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-address">Residential Address</Label>
          <Input
            id="kyc-address"
            placeholder="Full residential address"
            value={data.residentialAddress ?? ''}
            onChange={(e) => update('residentialAddress', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  )
}
