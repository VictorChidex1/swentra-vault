import { useState } from 'react'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency, type CurrencyCode } from '@/types/accounts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import {
  LandmarkIcon,
  CoinsIcon,
  ArrowRightLeftIcon,
  Loader2Icon,
} from 'lucide-react'

export default function TreasuryPage() {
  const { accounts, loading } = useAccounts({ type: 'system' })
  const [minting, setMinting] = useState(false)
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [amount, setAmount] = useState('')

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-[#888888]">
        <Loader2Icon className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const masterAccounts = accounts.filter((a) => a.id.startsWith('system-master'))
  const revenueAccounts = accounts.filter((a) => a.id.startsWith('system-revenue'))

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d.]/g, '')
    const parts = val.split('.')
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
    if (parts[1]?.length > 2) val = val.substring(0, val.indexOf('.') + 3)
    
    // Add commas to the integer part
    const formattedParts = val.split('.')
    if (formattedParts[0]) {
      formattedParts[0] = formattedParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    setAmount(formattedParts.join('.'))
  }

  const handleMint = async () => {
    const cleanAmount = amount.replace(/,/g, '')
    const numAmount = parseFloat(cleanAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Enter a valid amount to mint')
      return
    }

    if (!confirm(`Confirm minting ${formatCurrency(numAmount, currency)} to the Master Reserve?`)) {
      return
    }

    setMinting(true)
    try {
      const adminMintFunds = httpsCallable(functions, 'adminMintFunds')
      await adminMintFunds({ currency, amount: numAmount })
      toast.success(`${formatCurrency(numAmount, currency)} successfully minted to Treasury.`)
      setAmount('')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mint funds')
    } finally {
      setMinting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Treasury Reserve</h1>
        <p className="text-[#888888] mt-2">
          Manage system liquidity and monitor fee revenues across all operating currencies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minting Station */}
        <Card className="p-6 bg-[#0A0A0A] border-[#222222]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-[#00E559]/10 flex items-center justify-center">
              <LandmarkIcon className="h-5 w-5 text-[#00E559]" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Mint Liquidity</h2>
              <p className="text-sm text-[#888888]">Inject capital into the Master Reserve</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider mb-2 block">
                Currency
              </label>
              <div className="flex gap-2">
                {(['USD', 'EUR', 'CHF', 'GBP'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all duration-300 border ${
                      currency === c
                        ? 'bg-[#00E559]/10 border-[#00E559]/50 text-[#00E559]'
                        : 'bg-[#111111] border-[#222222] text-[#888888] hover:border-[#444444]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#888888] uppercase tracking-wider mb-2 block">
                Amount
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]">
                  {currency}
                </div>
                <Input
                  value={amount}
                  onChange={handleAmountChange}
                  className="pl-14 bg-[#111111] border-[#222222] text-xl font-medium h-14 placeholder:text-[#333333]"
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button
              onClick={handleMint}
              disabled={minting || !amount || parseFloat(amount.replace(/,/g, '')) <= 0}
              className="w-full h-12 bg-[#00E559] hover:bg-[#00CC4E] text-black font-medium text-lg rounded-xl transition-all duration-300"
            >
              {minting ? (
                <>
                  <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
                  Minting...
                </>
              ) : (
                'Mint Capital'
              )}
            </Button>
          </div>
        </Card>

        {/* Action Center Info */}
        <Card className="p-6 bg-[#0A0A0A] border-[#222222]">
           <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-[#111111] border border-[#222222] flex items-center justify-center">
              <ArrowRightLeftIcon className="h-5 w-5 text-[#888888]" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">System Ledgers</h2>
              <p className="text-sm text-[#888888]">Strict Double-Entry Accounting</p>
            </div>
          </div>
          <div className="space-y-4 text-sm text-[#888888]">
            <p>
              The <strong>Master Reserve</strong> holds base liquidity. When transferring funds to users, capital is debited from these accounts. When users wire funds externally, their principal is credited here before routing.
            </p>
            <p>
              The <strong>Revenue Account</strong> automatically accrues transfer fees. All fees charged during internal and external transactions are instantly routed to the respective currency revenue ledger.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium text-white mb-4">Master Reserves</h2>
          <div className="space-y-3">
            {masterAccounts.length === 0 && (
              <p className="text-[#555555] text-sm">No master accounts provisioned.</p>
            )}
            {masterAccounts.map((acc) => (
              <div key={acc.id} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{acc.currency} Reserve</div>
                  <div className="text-xs text-[#888888] font-mono mt-1">{acc.accountNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium text-lg">
                    {formatCurrency(acc.balance, acc.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-white mb-4">Fee Revenues</h2>
          <div className="space-y-3">
            {revenueAccounts.length === 0 && (
              <p className="text-[#555555] text-sm">No revenue accounts provisioned.</p>
            )}
            {revenueAccounts.map((acc) => (
              <div key={acc.id} className="p-4 rounded-xl bg-[#0A0A0A] border border-[#222222] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#00E559]/10 flex items-center justify-center">
                    <CoinsIcon className="h-4 w-4 text-[#00E559]" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{acc.currency} Revenue</div>
                    <div className="text-xs text-[#888888] font-mono mt-1">{acc.accountNumber}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#00E559] font-medium text-lg">
                    +{formatCurrency(acc.balance, acc.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
