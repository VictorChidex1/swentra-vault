import { useState, useMemo } from 'react'
import { collection, query, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'
import type { BankAccount } from '@/types/accounts'
import { formatCurrency } from '@/types/accounts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  BanknoteIcon,
  SearchIcon,
  UserIcon,
  WalletIcon,
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  AlertCircleIcon,
  Loader2Icon,
  ChevronRightIcon
} from 'lucide-react'

// Duplicating the interface here since it's used across admin pages
interface AdminUserRecord {
  uid: string
  email: string
  creationTime: string
  lastSignInTime: string
  disabled: boolean
  admin: boolean
  kycStatus: string
  accountsCount: number
}

export default function FundingPortalPage() {
  const fetcher = useMemo(() => async () => {
    const adminListUsers = httpsCallable<void, { users: AdminUserRecord[] }>(functions, 'adminListUsers')
    const result = await adminListUsers()
    return result.data.users
  }, [])

  const { data: usersData, loading: loadingUsers } = useAdminCache('admin-users', fetcher)
  const users = usersData || []

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null)
  
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)

  const [actionType, setActionType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d.]/g, '')
    const parts = val.split('.')
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('')
    }
    setAmount(val)
  }

  const formatDisplayAmount = (val: string) => {
    if (!val) return ''
    const parts = val.split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
  }

  // Step 1: Select User
  const handleSelectUser = async (user: AdminUserRecord) => {
    setSelectedUser(user)
    setSelectedAccount(null)
    setAccounts([])
    setAmount('')
    setDescription('')
    
    try {
      setLoadingAccounts(true)
      const q = query(collection(db, 'users', user.uid, 'accounts'))
      const snap = await getDocs(q)
      const fetchedAccounts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BankAccount[]
      setAccounts(fetchedAccounts)
    } catch (error) {
      console.error("Failed to load user accounts", error)
      toast.error("Failed to load user accounts")
    } finally {
      setLoadingAccounts(false)
    }
  }

  // Step 2: Select Account
  const handleSelectAccount = (account: BankAccount) => {
    setSelectedAccount(account)
    setAmount('')
    setDescription('')
  }

  // Step 3: Process Funding
  const handleProcessFunding = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser || !selectedAccount) {
      toast.error("Please select a user and an account first.")
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Amount must be a valid number greater than 0.")
      return
    }

    if (description.trim().length < 5) {
      toast.error("Please provide a meaningful description (at least 5 characters).")
      return
    }

    if (actionType === 'WITHDRAWAL' && numAmount > selectedAccount.availableBalance) {
      toast.error(`Cannot withdraw. Amount exceeds available balance of ${formatCurrency(selectedAccount.availableBalance, selectedAccount.currency)}.`)
      return
    }

    const confirmMsg = `Are you absolutely sure you want to ${actionType} ${formatCurrency(numAmount, selectedAccount.currency)} ${actionType === 'DEPOSIT' ? 'to' : 'from'} ${selectedUser.email}'s account?`
    if (!confirm(confirmMsg)) return

    try {
      setProcessing(true)
      const adminProcessFunding = httpsCallable<any, { success: boolean, message: string }>(functions, 'adminProcessFunding')
      
      const result = await adminProcessFunding({
        targetUid: selectedUser.uid,
        accountId: selectedAccount.id,
        amount: numAmount,
        type: actionType,
        description: description.trim()
      })

      if (result.data.success) {
        toast.success(result.data.message)
        // Reset form & reload accounts to show new balance
        setAmount('')
        setDescription('')
        await handleSelectUser(selectedUser) // Refresh balances
      }
    } catch (error: any) {
      console.error("Funding failed", error)
      toast.error(error.message || "Failed to process funding transaction.")
    } finally {
      setProcessing(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
          <BanknoteIcon className="w-6 h-6 text-primary" />
          Funding Portal
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Securely process manual deposits and withdrawals for user accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* LEFT PANE: Directory & Selection */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {loadingUsers ? (
              <div className="flex justify-center p-8">
                <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground bg-surface rounded-lg border border-border">
                No users found.
              </div>
            ) : (
              filteredUsers.map(user => (
                <div 
                  key={user.uid}
                  onClick={() => handleSelectUser(user)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedUser?.uid === user.uid 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-surface hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      selectedUser?.uid === user.uid ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{user.email}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">{user.uid}</div>
                    </div>
                    {selectedUser?.uid === user.uid && (
                      <ChevronRightIcon className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: Action Form */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {!selectedUser ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-surface/50 border border-dashed border-border rounded-xl p-8">
              <UserIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a user from the directory to begin funding.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Account Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Select Account</h3>
                {loadingAccounts ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-surface rounded-lg border border-border">
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                    Loading accounts...
                  </div>
                ) : accounts.length === 0 ? (
                  <div className="p-4 text-sm text-red-500 bg-red-500/10 rounded-lg border border-red-500/20">
                    This user has no active bank accounts to fund.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accounts.map(account => (
                      <div 
                        key={account.id}
                        onClick={() => handleSelectAccount(account)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedAccount?.id === account.id 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-border bg-surface hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <WalletIcon className={`w-4 h-4 ${selectedAccount?.id === account.id ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="font-medium text-sm">{account.currency} {account.type === 'current' ? 'Current' : 'Reserve'}</span>
                        </div>
                        <div className="text-lg font-semibold tracking-tight">
                          {formatCurrency(account.availableBalance, account.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          {account.accountNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Funding Form */}
              {selectedAccount && (
                <Card className="p-6 bg-surface border-border overflow-hidden relative">
                  {/* Subtle background glow based on action */}
                  <div className={`absolute inset-0 opacity-5 pointer-events-none transition-colors duration-500 ${
                    actionType === 'DEPOSIT' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  
                  <form onSubmit={handleProcessFunding} className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActionType('DEPOSIT')}
                        className={`flex-1 flex gap-2 h-12 ${
                          actionType === 'DEPOSIT' 
                            ? 'bg-green-500/10 text-green-500 border-green-500/50 hover:bg-green-500/20 hover:text-green-500' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <ArrowDownToLineIcon className="w-4 h-4" />
                        Deposit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActionType('WITHDRAWAL')}
                        className={`flex-1 flex gap-2 h-12 ${
                          actionType === 'WITHDRAWAL' 
                            ? 'bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20 hover:text-red-500' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <ArrowUpFromLineIcon className="w-4 h-4" />
                        Withdraw
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Amount ({selectedAccount.currency})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            {selectedAccount.currency === 'USD' ? '$' : selectedAccount.currency === 'EUR' ? '€' : selectedAccount.currency === 'CHF' ? 'CHF ' : '₦'}
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={formatDisplayAmount(amount)}
                            onChange={handleAmountChange}
                            className={`h-12 text-lg ${selectedAccount.currency === 'CHF' ? 'pl-14' : 'pl-8'}`}
                            required
                          />
                        </div>
                        {actionType === 'WITHDRAWAL' && parseFloat(amount) > selectedAccount.availableBalance && (
                          <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircleIcon className="w-3 h-3" />
                            Amount exceeds available balance.
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Transaction Memo (Audit Trail)</label>
                        <Input
                          placeholder="e.g., Initial Deposit, Wire Transfer, Correction"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="h-12"
                          required
                          minLength={5}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={processing || (actionType === 'WITHDRAWAL' && parseFloat(amount) > selectedAccount.availableBalance)}
                      className={`w-full h-12 text-base font-medium transition-colors ${
                        actionType === 'DEPOSIT' 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {processing ? (
                        <>
                          <Loader2Icon className="w-5 h-5 mr-2 animate-spin" />
                          Processing {actionType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}...
                        </>
                      ) : (
                        <>
                          {actionType === 'DEPOSIT' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
