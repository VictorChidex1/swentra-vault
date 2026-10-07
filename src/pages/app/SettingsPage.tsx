import { useState } from 'react'
import { LockIcon, ShieldCheckIcon, AlertCircleIcon, ShieldIcon, ActivityIcon, CreditCardIcon, UserIcon, BellIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useKyc } from '@/hooks/useKyc'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal'

export default function SettingsPage() {
  const { user } = useAuth()
  const { record: kycRecord } = useKyc()
  
  const [phishingCode, setPhishingCode] = useState('SWENTRA-2026')
  const [isEditingLimits, setIsEditingLimits] = useState(false)
  const [dailyLimit, setDailyLimit] = useState('50000')
  const [monthlyLimit, setMonthlyLimit] = useState('2500000')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  return (
    <div className="mx-auto max-w-4xl py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Vault Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your secure profile, authentication, and platform preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-surface/50 border border-border p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldIcon className="size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <BellIcon className="size-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="limits" className="flex items-center gap-2">
            <ActivityIcon className="size-4" />
            Limits
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6 outline-none">
          <Card className="p-6 md:p-8 bg-surface/30 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground">Verified Identity</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your legal identity is cryptographically bound to your vault.
                </p>
              </div>
              <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <ShieldCheckIcon className="size-8 text-primary" />
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <div className="grid gap-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  Legal Full Name
                  <LockIcon className="size-3 text-primary" />
                </Label>
                <div className="flex h-10 w-full items-center rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground opacity-80 cursor-not-allowed">
                  {kycRecord?.personalDetails?.firstName} {kycRecord?.personalDetails?.lastName}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  Registered Email
                  <LockIcon className="size-3 text-primary" />
                </Label>
                <div className="flex h-10 w-full items-center rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground opacity-80 cursor-not-allowed">
                  {user?.email}
                </div>
              </div>

              <div className="rounded-lg bg-surface/50 border border-border p-4 flex gap-3 items-start">
                <AlertCircleIcon className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  To request a legal name change or update your verified contact information, please contact your dedicated Private Banker or Swentra Support.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6 outline-none">
          <Card className="p-6 md:p-8 bg-surface/30 backdrop-blur-sm border-border">
            <div className="space-y-8">
              {/* Anti-Phishing Code */}
              <div>
                <h3 className="text-lg font-medium text-foreground">Anti-Phishing Code</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  This unique code will appear in all official emails from Swentra Vault. If an email claims to be from us but does not include this exact code, it is fraudulent.
                </p>
                <div className="flex gap-4">
                  <Input 
                    value={phishingCode}
                    onChange={(e) => setPhishingCode(e.target.value.toUpperCase())}
                    className="max-w-[200px] font-mono tracking-widest text-primary"
                    maxLength={12}
                  />
                  <Button variant="outline">Update Code</Button>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* 2FA */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-foreground">Two-Factor Authentication (2FA)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Require a security key or authenticator app to access your vault.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="border-t border-border" />

              {/* Password */}
              <div>
                <h3 className="text-base font-medium text-foreground">Update Password</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Ensure your new password is at least 12 characters and highly secure.
                </p>
                <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>Change Password</Button>
              </div>
              
              <ChangePasswordModal 
                open={isPasswordModalOpen} 
                onOpenChange={setIsPasswordModalOpen} 
              />

              <div className="border-t border-border" />

              {/* Danger Zone */}
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <h3 className="text-base font-medium text-destructive">Freeze Vault</h3>
                <p className="text-sm text-destructive/80 mt-1 mb-4">
                  Instantly block all outgoing transfers and exchange operations. You will still be able to log in.
                </p>
                <Button variant="destructive" className="w-full sm:w-auto">
                  Freeze Account Operations
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-6 outline-none">
          <Card className="p-6 md:p-8 bg-surface/30 backdrop-blur-sm border-border">
            <h2 className="text-lg font-medium text-foreground mb-6">Notifications & Display</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Large Transfer Alerts</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive SMS and email when a transfer exceeds CHF 10,000.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Login Notifications</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert me whenever a new device accesses my vault.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Monthly Statements</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send encrypted PDF statements to my registered email.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* LIMITS TAB */}
        <TabsContent value="limits" className="space-y-6 outline-none">
          <Card className="p-6 md:p-8 bg-surface/30 backdrop-blur-sm border-border">
            <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground">Account Tier</h2>
                <div className="mt-2 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  SWENTRA PRIVATE CLIENT
                </div>
              </div>
              <CreditCardIcon className="size-8 text-muted-foreground/30" />
            </div>

            {isEditingLimits ? (
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label>Personal Daily Limit (CHF)</Label>
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    value={dailyLimit ? Number(dailyLimit).toLocaleString() : ''} 
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setDailyLimit(raw)
                    }} 
                  />
                  <p className="text-xs text-muted-foreground">Platform Maximum: CHF 500,000</p>
                </div>
                
                <div className="grid gap-2">
                  <Label>Personal Monthly Limit (CHF)</Label>
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    value={monthlyLimit ? Number(monthlyLimit).toLocaleString() : ''} 
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setMonthlyLimit(raw)
                    }} 
                  />
                </div>

                <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 flex gap-3">
                  <AlertCircleIcon className="size-5 text-warning shrink-0" />
                  <p className="text-sm text-warning/90">
                    Decreasing your limits takes effect immediately. Increasing limits beyond your current baseline may require up to 24 hours and a manual review by your Private Banker.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEditingLimits(false)}>Cancel</Button>
                  <Button onClick={() => setIsEditingLimits(false)}>Save Changes</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground">Daily Transfer Limit</span>
                    <span className="font-mono text-muted-foreground">CHF 0 / CHF {Number(dailyLimit).toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[0%]" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You have not made any transfers today.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground">Monthly Transfer Limit</span>
                    <span className="font-mono text-muted-foreground">CHF {Number(monthlyLimit).toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 w-[5%]" />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsEditingLimits(true)}>Edit Limits</Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
