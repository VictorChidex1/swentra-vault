import { useState, useMemo, useEffect } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  SettingsIcon,
  ShieldAlertIcon,
  SaveIcon,
  PercentIcon,
  BanknoteIcon,
  ActivityIcon,
  Loader2Icon,
  ToggleLeftIcon,
  ToggleRightIcon
} from 'lucide-react'

interface SystemConfig {
  fxMarginPercent: number
  wireTransferFee: number
  swentraTransferFee: number
  transfersEnabled: boolean
  maintenanceMode: boolean
}

export default function SettingsPage() {
  const fetcher = useMemo(() => async () => {
    const adminGetSystemConfig = httpsCallable<void, SystemConfig>(functions, 'adminGetSystemConfig')
    const result = await adminGetSystemConfig()
    return result.data
  }, [])

  const { data: configData, loading: loadingConfig, mutate } = useAdminCache('admin-system-config', fetcher)
  
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync state when cache resolves
  useEffect(() => {
    if (configData && !hasChanges) {
      setConfig(configData)
    }
  }, [configData, hasChanges])

  const handleUpdate = (field: keyof SystemConfig, value: number | boolean) => {
    if (!config) return
    setConfig({ ...config, [field]: value })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!config) return
    try {
      setSaving(true)
      const adminUpdateSystemConfig = httpsCallable<SystemConfig, { success: boolean, message: string }>(functions, 'adminUpdateSystemConfig')
      await adminUpdateSystemConfig(config)
      
      mutate(config)
      setHasChanges(false)
      toast.success("System configuration updated successfully.")
    } catch (error: any) {
      console.error("Failed to update config:", error)
      toast.error(error.message || "Failed to save configuration.")
    } finally {
      setSaving(false)
    }
  }

  if (loadingConfig && !config) {
    return (
      <div className="h-full flex items-center justify-center flex-col text-muted-foreground">
        <Loader2Icon className="w-8 h-8 animate-spin text-primary mb-4" />
        <p>Loading global settings...</p>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-6 h-full flex flex-col relative pb-20">
      <div>
        <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          Global Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage platform fees, security toggles, and financial margins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
        
        {/* Financial Settings */}
        <Card className="p-6 bg-surface border-border flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <PercentIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium">Financial & Fee Engine</h2>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                FX Spread Margin (%)
                <span className="text-muted-foreground font-mono">{config.fxMarginPercent.toFixed(2)}%</span>
              </label>
              <p className="text-xs text-muted-foreground">The percentage markup applied to mid-market exchange rates.</p>
              <div className="relative">
                <PercentIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.fxMarginPercent}
                  onChange={(e) => handleUpdate('fxMarginPercent', parseFloat(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                External Wire Transfer Fee (Flat)
                <span className="text-muted-foreground font-mono">${config.wireTransferFee.toFixed(2)}</span>
              </label>
              <p className="text-xs text-muted-foreground">The flat fee charged for outgoing external bank wires.</p>
              <div className="relative">
                <BanknoteIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  value={config.wireTransferFee}
                  onChange={(e) => handleUpdate('wireTransferFee', parseFloat(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex justify-between">
                Internal Swentra Transfer Fee (Flat)
                <span className="text-muted-foreground font-mono">${config.swentraTransferFee.toFixed(2)}</span>
              </label>
              <p className="text-xs text-muted-foreground">The flat fee charged for user-to-user internal transfers.</p>
              <div className="relative">
                <BanknoteIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.50"
                  min="0"
                  value={config.swentraTransferFee}
                  onChange={(e) => handleUpdate('swentraTransferFee', parseFloat(e.target.value) || 0)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Platform Controls */}
        <Card className="p-6 bg-surface border-border flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <ShieldAlertIcon className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-medium">Security Controls</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-black/20">
              <div className="space-y-1">
                <h3 className="font-medium flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-blue-500" />
                  Outgoing Transfers Allowed
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  If disabled, users will not be able to initiate any new outgoing transfers. Internal and external transfers will be blocked.
                </p>
              </div>
              <button 
                onClick={() => handleUpdate('transfersEnabled', !config.transfersEnabled)}
                className={`transition-colors ${config.transfersEnabled ? 'text-green-500' : 'text-muted-foreground'}`}
              >
                {config.transfersEnabled ? <ToggleRightIcon className="w-10 h-10" /> : <ToggleLeftIcon className="w-10 h-10" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <div className="space-y-1">
                <h3 className="font-medium text-red-500 flex items-center gap-2">
                  <ShieldAlertIcon className="w-4 h-4" />
                  System Maintenance Mode
                </h3>
                <p className="text-xs text-red-500/80 max-w-sm">
                  DANGER: Enabling this will immediately lock out all non-admin users from the application. Use only during critical updates or emergencies.
                </p>
              </div>
              <button 
                onClick={() => handleUpdate('maintenanceMode', !config.maintenanceMode)}
                className={`transition-colors ${config.maintenanceMode ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                {config.maintenanceMode ? <ToggleRightIcon className="w-10 h-10" /> : <ToggleLeftIcon className="w-10 h-10" />}
              </button>
            </div>
          </div>
        </Card>

      </div>

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+120px)] w-full max-w-md animate-in slide-in-from-bottom-10">
          <Card className="p-4 bg-primary text-primary-foreground border-none shadow-2xl flex items-center justify-between">
            <span className="font-medium">You have unsaved changes</span>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-primary-foreground/10"
                onClick={() => {
                  setConfig(configData)
                  setHasChanges(false)
                }}
                disabled={saving}
              >
                Discard
              </Button>
              <Button 
                size="sm" 
                className="bg-primary-foreground text-primary hover:bg-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
