import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheckIcon, KeyRoundIcon, SmartphoneIcon, Loader2Icon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PinKeypad } from '@/components/ui/pin-keypad';
import { toast } from 'sonner';

export default function SecurityPage() {
  const { user } = useAuth();
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists() && snap.data()?.pinHash) {
        setHasPin(true);
      } else {
        setHasPin(false);
      }
    });
    return () => unsub();
  }, [user]);

  // Setup flow state
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState('');
  
  // Change flow state
  const [changeStep, setChangeStep] = useState<1 | 2 | 3>(1);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // --- SETUP PIN FLOW ---
  const handleSetupComplete = async (pin: string) => {
    setError(false);
    
    if (setupStep === 1) {
      setFirstPin(pin);
      setSetupStep(2);
      return;
    }

    if (setupStep === 2) {
      if (pin !== firstPin) {
        toast.error('PINs do not match. Try again.');
        setFirstPin('');
        setSetupStep(1);
        setError(true);
        return;
      }

      setLoading(true);
      try {
        const setupTransactionPin = httpsCallable<{ pin: string }, any>(functions, 'setupTransactionPin');
        await setupTransactionPin({ pin });
        toast.success('Transaction PIN configured successfully.');
        setSetupModalOpen(false);
      } catch (err: any) {
        toast.error(err.message || 'Failed to setup PIN');
        setError(true);
        setSetupStep(1);
        setFirstPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  // --- CHANGE PIN FLOW ---
  const handleChangeComplete = async (pin: string) => {
    setError(false);
    
    if (changeStep === 1) {
      setOldPin(pin);
      setChangeStep(2);
      return;
    }

    if (changeStep === 2) {
      setNewPin(pin);
      setChangeStep(3);
      return;
    }

    if (changeStep === 3) {
      if (pin !== newPin) {
        toast.error('PINs do not match. Try again.');
        setNewPin('');
        setChangeStep(2);
        setError(true);
        return;
      }

      setLoading(true);
      try {
        const changeTransactionPin = httpsCallable<{ oldPin: string, newPin: string }, any>(functions, 'changeTransactionPin');
        await changeTransactionPin({ oldPin, newPin: pin });
        toast.success('Transaction PIN changed successfully.');
        setChangeModalOpen(false);
      } catch (err: any) {
        toast.error(err.message || 'Failed to change PIN');
        setError(true);
        setChangeStep(1);
        setOldPin('');
        setNewPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 py-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Security Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account security, passwords, and transaction PIN.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction PIN Card */}
        <Card className="p-6 bg-surface/30 border-border">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <KeyRoundIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Transaction PIN</h2>
              <p className="text-xs text-muted-foreground">Secure your outbound transfers</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your 4-digit Transaction PIN is required to authorize any funds transfer out of your accounts. 
              Never share this PIN with anyone.
            </p>
            
            <div className="flex gap-3 pt-2">
              {hasPin === false && (
                <Button 
                  onClick={() => {
                    setSetupStep(1);
                    setFirstPin('');
                    setSetupModalOpen(true);
                  }} 
                  className="flex-1"
                >
                  Setup PIN
                </Button>
              )}
              {hasPin === true && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setChangeStep(1);
                    setOldPin('');
                    setNewPin('');
                    setChangeModalOpen(true);
                  }} 
                  className="flex-1"
                >
                  Change PIN
                </Button>
              )}
              {hasPin === null && (
                <Button variant="outline" disabled className="flex-1">
                  Loading...
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* 2FA Card Placeholder */}
        <Card className="p-6 bg-surface/30 border-border">
          <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <SmartphoneIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-medium text-foreground">Two-Factor Auth</h2>
              <p className="text-xs text-muted-foreground">Add an extra layer of login security</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Protect your account from unauthorized access by requiring a second form of authentication 
              when signing in from a new device.
            </p>
            <Button variant="outline" className="w-full mt-2" disabled>
              Coming Soon
            </Button>
          </div>
        </Card>
      </div>

      {/* SETUP PIN MODAL */}
      <Dialog open={setupModalOpen} onOpenChange={setSetupModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center sm:text-center pt-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Setup Transaction PIN</DialogTitle>
            <DialogDescription className="text-center">
              {setupStep === 1 ? "Enter a 4-digit PIN to secure your transactions." : "Please confirm your 4-digit PIN."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[340px]">
                <Loader2Icon className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : (
              <PinKeypad 
                key={`setup-${setupStep}`}
                onPinComplete={handleSetupComplete}
                error={error}
                clearError={() => setError(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CHANGE PIN MODAL */}
      <Dialog open={changeModalOpen} onOpenChange={setChangeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center sm:text-center pt-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRoundIcon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Change Transaction PIN</DialogTitle>
            <DialogDescription className="text-center">
              {changeStep === 1 && "First, enter your CURRENT 4-digit PIN."}
              {changeStep === 2 && "Now, enter your NEW 4-digit PIN."}
              {changeStep === 3 && "Please confirm your NEW 4-digit PIN."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[340px]">
                <Loader2Icon className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : (
              <PinKeypad 
                key={`change-${changeStep}`}
                onPinComplete={handleChangeComplete}
                error={error}
                clearError={() => setError(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
