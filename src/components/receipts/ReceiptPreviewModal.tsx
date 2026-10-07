import { useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DownloadIcon, Loader2Icon } from 'lucide-react'
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
      <DialogContent className="sm:max-w-[900px] h-[90vh] p-0 flex flex-col bg-surface border-border overflow-hidden">
        {/* Header Actions */}
        <DialogTitle className="sr-only">Receipt Preview</DialogTitle>
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface/80 backdrop-blur z-10">
          <div>
            <h2 className="text-lg font-medium text-foreground">Transaction Receipt</h2>
            <p className="text-sm text-muted-foreground font-mono">{transaction.id}</p>
          </div>
          <div className="flex items-center gap-4">
            {error && <span className="text-sm text-destructive">{error}</span>}
            <Button 
              onClick={handleDownload} 
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto bg-black/20 py-8 px-4 flex justify-center items-start">
          {/* We use a relative wrapper to reserve the exact scaled space, while the child absolute div holds the 800px PDF-ready element scaled down visually */}
          <div className="relative w-[340px] h-[425px] sm:w-[600px] sm:h-[750px] md:w-[800px] md:h-[1000px] shrink-0 mb-20 transition-all duration-300">
            <div className="absolute top-0 left-0 origin-top-left transform-gpu scale-[0.425] sm:scale-[0.75] md:scale-100 shadow-2xl shadow-black/50 bg-white">
              <ReceiptTemplate transaction={transaction} forwardRef={receiptRef} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
