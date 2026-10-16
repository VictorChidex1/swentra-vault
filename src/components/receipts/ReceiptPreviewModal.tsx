import { useRef } from 'react'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DownloadIcon, Loader2Icon, XIcon } from 'lucide-react'
import type { Transaction } from '@/types/transactions'
import { ReceiptTemplate } from './ReceiptTemplate'
import { usePDFReceipt } from '@/hooks/usePDFReceipt'

interface ReceiptPreviewModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReceiptPreviewModal({ transaction, open, onOpenChange }: ReceiptPreviewModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const { generatePDF, isGenerating, error } = usePDFReceipt()

  if (!transaction) return null

  const handleDownload = () => {
    if (receiptRef.current) {
      generatePDF(receiptRef.current, `Swentra_Receipt_${transaction.id.toUpperCase()}.pdf`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        onPointerDownOutside={() => onOpenChange(false)}
        onInteractOutside={() => onOpenChange(false)}
        className="sm:max-w-[900px] h-[90vh] p-0 flex flex-col bg-surface border-border overflow-hidden"
      >
        {/* Header Actions */}
        <DialogTitle className="sr-only">Receipt Preview</DialogTitle>
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/80 backdrop-blur z-10">
          <div>
            <h2 className="text-base sm:text-lg font-medium text-foreground">Transaction Receipt</h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">{transaction.id}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {error && <span className="text-xs sm:text-sm text-destructive hidden md:inline">{error}</span>}
            <Button 
              onClick={handleDownload} 
              disabled={isGenerating}
              size="sm"
              className="gap-2 text-xs sm:text-sm"
            >
              {isGenerating ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
              <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
            </Button>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg shrink-0 transition-colors"
                aria-label="Close receipt"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Scrollable Preview Area - clicking anywhere outside the receipt paper dismisses the modal */}
        <div 
          onClick={() => onOpenChange(false)}
          className="flex-1 overflow-y-auto bg-black/40 py-8 px-4 flex justify-center items-start cursor-pointer"
        >
          {/* We use a relative wrapper to reserve the exact scaled space; stopPropagation protects clicks inside the receipt */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-[340px] h-[425px] sm:w-[600px] sm:h-[750px] md:w-[800px] md:h-[1000px] shrink-0 mb-20 transition-all duration-300 cursor-default"
          >
            <div className="absolute top-0 left-0 origin-top-left transform-gpu scale-[0.425] sm:scale-[0.75] md:scale-100 shadow-2xl shadow-black/50 bg-white">
              <ReceiptTemplate transaction={transaction} forwardRef={receiptRef} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
