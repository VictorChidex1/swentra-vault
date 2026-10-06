import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { PinKeypad } from '@/components/ui/pin-keypad';
import { Loader2Icon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PinVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  description?: string;
  pinLength?: number;
}

export function PinVerificationModal({
  open,
  onOpenChange,
  onSuccess,
  description = "Enter your 4-digit PIN to authorize this transaction.",
  pinLength = 4
}: PinVerificationModalProps) {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handlePinComplete = async (pin: string) => {
    setVerifying(true);
    setError(false);
    setErrorMessage('');
    
    try {
      const verifyTransactionPin = httpsCallable<{ pin: string }, { success: boolean, valid: boolean }>(functions, 'verifyTransactionPin');
      const result = await verifyTransactionPin({ pin });
      
      if (result.data.success && result.data.valid) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error("PIN verification failed:", err);
      setError(true);
      
      // The Cloud Function throws specific HttpsErrors (e.g. invalid-argument for wrong PIN)
      if (err.code === 'permission-denied') {
        setErrorMessage("Account locked due to too many failed attempts.");
        toast.error("Account Locked", { description: err.message });
      } else if (err.code === 'failed-precondition') {
        setErrorMessage("Transaction PIN is not set up.");
        toast.error("No PIN Setup", { description: "Please go to Settings > Security to set up your PIN." });
      } else {
        setErrorMessage(err.message || "Incorrect PIN.");
        // We use a small vibration for error if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-surface shadow-2xl">
        <DialogHeader className="flex flex-col items-center sm:text-center pt-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheckIcon className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Security Verification</DialogTitle>
          <DialogDescription className="text-center max-w-[250px]">
            {errorMessage ? (
              <span className="text-red-500 font-medium">{errorMessage}</span>
            ) : (
              description
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 relative">
          {verifying ? (
            <div className="flex flex-col items-center justify-center h-[340px] space-y-4">
              <Loader2Icon className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Securing transaction...</p>
            </div>
          ) : (
            <div className="h-[340px] flex items-center">
              <PinKeypad 
                pinLength={pinLength}
                onPinComplete={handlePinComplete}
                disabled={verifying}
                error={error}
                clearError={() => setError(false)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
