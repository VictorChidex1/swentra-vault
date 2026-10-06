import { useState } from 'react'
import { motion } from 'motion/react'
import { PlusIcon, BuildingIcon, GlobeIcon, Trash2Icon, SendIcon } from 'lucide-react'
import { useBeneficiaries } from '@/hooks/useBeneficiaries'
import { AddBeneficiaryModal } from '@/components/beneficiaries/AddBeneficiaryModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'


export default function BeneficiariesPage() {
  const { beneficiaries, isLoading, addBeneficiary, removeBeneficiary } = useBeneficiaries()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const handleAdd = async (data: any) => {
    await addBeneficiary(data)
  }

  // Format Swentra numbers correctly for display
  const formatAccountDisplay = (account: string, type: string) => {
    if (type === 'INTERNAL') {
      const raw = account.replace(/\D/g, '')
      const match = raw.match(/.{1,4}/g)
      return match ? match.join(' ') : raw
    }
    return account
  }

  return (
    <div className="mx-auto max-w-5xl py-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            Trusted Payees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your verified beneficiaries for secure transfers.
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shrink-0">
          <PlusIcon className="size-4" />
          Add Payee
        </Button>
      </div>

      <AddBeneficiaryModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen} 
        onAdd={handleAdd} 
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : beneficiaries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/30 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BuildingIcon className="size-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">No Trusted Payees</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            You haven't verified any beneficiaries yet. Add a payee to securely transfer funds.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} variant="outline" className="mt-6">
            Add Your First Payee
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficiaries.map((payee, idx) => (
            <motion.div
              key={payee.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-5 bg-surface/30 backdrop-blur-sm border-border hover:border-primary/30 transition-colors group relative cursor-pointer overflow-hidden flex flex-col h-full">
                
                {/* Background decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-lg">
                      {payee.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
                      {payee.status}
                    </div>
                  </div>

                  <h3 className="font-medium text-foreground text-lg leading-tight truncate">
                    {payee.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                    {payee.type === 'INTERNAL' ? (
                      <BuildingIcon className="size-3 text-primary" />
                    ) : (
                      <GlobeIcon className="size-3 text-primary" />
                    )}
                    <span className="truncate">{payee.bankName}</span>
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-surface/50 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                      {payee.type === 'INTERNAL' ? 'Account Number' : 'IBAN'}
                    </p>
                    <p className="font-mono text-sm text-foreground">
                      {formatAccountDisplay(payee.accountNumber, payee.type)}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 mt-6 flex gap-2">
                  <Button className="flex-1 gap-2" variant="secondary" size="sm">
                    <SendIcon className="size-3" />
                    Send Funds
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 px-3"
                    onClick={() => removeBeneficiary(payee.id)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
