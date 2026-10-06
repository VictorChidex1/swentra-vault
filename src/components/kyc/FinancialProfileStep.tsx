import {
  EMPLOYMENT_STATUS_LABELS,
  SOURCE_OF_FUNDS_LABELS,
  MONTHLY_ACTIVITY_LABELS,
  ACCOUNT_PURPOSE_LABELS,
  type FinancialProfile,
} from '@/types/kyc'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface FinancialProfileStepProps {
  data: Partial<FinancialProfile>
  onChange: (data: Partial<FinancialProfile>) => void
}

export function FinancialProfileStep({
  data,
  onChange,
}: FinancialProfileStepProps) {
  function update(field: keyof FinancialProfile, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Stage 03 / 04
        </p>
        <h2 className="mt-2 text-xl font-medium text-foreground">
          Financial Profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          To comply with international regulations, we require basic information
          about your source of funds and expected activity.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-employment">Employment Status</Label>
          <select
            id="kyc-employment"
            value={data.employmentStatus ?? ''}
            onChange={(e) => update('employmentStatus', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="" disabled>
              Select status
            </option>
            {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-occupation">Occupation / Job Title</Label>
          <Input
            id="kyc-occupation"
            placeholder="e.g. Software Engineer"
            value={data.occupation ?? ''}
            onChange={(e) => update('occupation', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-source-funds">Primary Source of Funds</Label>
          <select
            id="kyc-source-funds"
            value={data.sourceOfFunds ?? ''}
            onChange={(e) => update('sourceOfFunds', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="" disabled>
              Select source
            </option>
            {Object.entries(SOURCE_OF_FUNDS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-activity">Expected Monthly Activity</Label>
          <select
            id="kyc-activity"
            value={data.expectedMonthlyActivity ?? ''}
            onChange={(e) => update('expectedMonthlyActivity', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="" disabled>
              Select expected volume
            </option>
            {Object.entries(MONTHLY_ACTIVITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kyc-purpose">Primary Account Purpose</Label>
        <select
          id="kyc-purpose"
          value={data.accountPurpose ?? ''}
          onChange={(e) => update('accountPurpose', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="" disabled>
            Select purpose
          </option>
          {Object.entries(ACCOUNT_PURPOSE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
