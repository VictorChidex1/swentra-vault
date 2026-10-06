import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ShieldAlertIcon, CheckCircleIcon, Loader2Icon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function BootstrapAdminPage() {
  const { user } = useAuth()
  const [secretKey, setSecretKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleMakeAdmin = async () => {
    if (!secretKey) return
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      const bootstrapAdmin = httpsCallable<{ secretKey: string }, { success: boolean; message: string }>(functions, 'bootstrapAdmin')
      const result = await bootstrapAdmin({ secretKey })
      
      if (result.data.success) {
        setMessage(result.data.message)
        // Force token refresh
        await user?.getIdToken(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate admin key.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 space-y-6 border-border bg-surface">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldAlertIcon className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-medium tracking-tight">Admin Override</h1>
          <p className="text-sm text-muted-foreground">
            Promote your account to Administrator status.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Input 
            type="password" 
            placeholder="Secret Key" 
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="h-12"
          />
          
          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          {message && (
            <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
              <CheckCircleIcon className="w-4 h-4" />
              {message}
            </div>
          )}

          <Button 
            className="w-full h-12" 
            onClick={handleMakeAdmin}
            disabled={!secretKey || loading || !!message}
          >
            {loading ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : 'Promote to Admin'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
