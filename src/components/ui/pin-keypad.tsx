import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { DeleteIcon, FingerprintIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinKeypadProps {
  pinLength?: number;
  onPinComplete: (pin: string) => void;
  disabled?: boolean;
  error?: boolean;
  clearError?: () => void;
  showBiometrics?: boolean;
  onBiometricAuth?: () => void;
}

export function PinKeypad({
  pinLength = 4,
  onPinComplete,
  disabled = false,
  error = false,
  clearError,
  showBiometrics = false,
  onBiometricAuth
}: PinKeypadProps) {
  const [pin, setPin] = useState<string>('');

  // Handle keyboard input for accessibility and convenience
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled) return;
    if (error && clearError) clearError();

    if (e.key === 'Backspace') {
      setPin(prev => prev.slice(0, -1));
    } else if (/^[0-9]$/.test(e.key)) {
      setPin(prev => {
        if (prev.length >= pinLength) return prev;
        const newPin = prev + e.key;
        if (newPin.length === pinLength) {
          // Use setTimeout to allow the last dot to fill before firing completion
          setTimeout(() => onPinComplete(newPin), 100);
        }
        return newPin;
      });
    }
  }, [disabled, pinLength, onPinComplete, error, clearError]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNumberPress = (num: number) => {
    if (disabled) return;
    if (error && clearError) clearError();
    
    setPin(prev => {
      if (prev.length >= pinLength) return prev;
      const newPin = prev + num;
      if (newPin.length === pinLength) {
        setTimeout(() => onPinComplete(newPin), 100);
      }
      return newPin;
    });
  };

  const handleBackspace = () => {
    if (disabled) return;
    if (error && clearError) clearError();
    setPin(prev => prev.slice(0, -1));
  };

  // Vibrate on tap if supported
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Reset PIN when error becomes true (handled by parent typically, but good to have)
  useEffect(() => {
    if (error) {
      setPin('');
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto space-y-8">
      {/* PIN Dots Indicator */}
      <motion.div 
        className="flex items-center gap-4"
        animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {Array.from({ length: pinLength }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "w-4 h-4 rounded-full border-2 transition-all duration-200",
              pin.length > i 
                ? "bg-primary border-primary scale-110" 
                : error 
                  ? "border-red-500 bg-red-500/20" 
                  : "border-muted-foreground/30 bg-transparent"
            )}
          />
        ))}
      </motion.div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            disabled={disabled}
            onClick={() => { triggerHaptic(); handleNumberPress(num); }}
            className="h-16 rounded-full flex items-center justify-center text-2xl font-light active:bg-primary/20 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {num}
          </button>
        ))}

        {/* Bottom Row */}
        <div className="flex items-center justify-center">
          {showBiometrics ? (
            <button
              onClick={() => { triggerHaptic(); onBiometricAuth?.(); }}
              disabled={disabled}
              className="h-16 w-16 rounded-full flex items-center justify-center text-primary active:bg-primary/20 hover:bg-white/5 transition-colors"
            >
              <FingerprintIcon className="w-8 h-8" />
            </button>
          ) : (
            <div /> // Empty space
          )}
        </div>

        <button
          onClick={() => { triggerHaptic(); handleNumberPress(0); }}
          disabled={disabled}
          className="h-16 rounded-full flex items-center justify-center text-2xl font-light active:bg-primary/20 hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          0
        </button>

        <button
          onClick={() => { triggerHaptic(); handleBackspace(); }}
          disabled={disabled || pin.length === 0}
          className="h-16 rounded-full flex items-center justify-center text-muted-foreground active:bg-white/10 hover:bg-white/5 transition-colors disabled:opacity-30"
        >
          <DeleteIcon className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
