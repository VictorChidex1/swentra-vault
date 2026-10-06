import { useState, useMemo } from 'react'
import { collection, query, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Loader2Icon,
  SearchIcon,
  ShieldIcon,
  ShieldBanIcon,
  BanknoteIcon,
  UserIcon,
  ChevronLeftIcon,
  WalletIcon
} from 'lucide-react'
import type { BankAccount } from '@/types/accounts'
import { formatCurrency } from '@/types/accounts'

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

export default function UsersPage() {
  const fetcher = useMemo(() => async () => {
    const adminListUsers = httpsCallable<void, { users: AdminUserRecord[] }>(functions, 'adminListUsers')
    const result = await adminListUsers()
    return result.data.users
  }, [])

  const { data: usersData, loading, mutate } = useAdminCache('admin-users', fetcher)
  const users = usersData || []

  const [processingUid, setProcessingUid] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null)
  const [userAccounts, setUserAccounts] = useState<BankAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  const toggleUserStatus = async (uid: string, currentDisabled: boolean) => {
    if (!confirm(`Are you sure you want to ${currentDisabled ? 'enable' : 'disable'} this user account?`)) {
      return
    }

    try {
      setProcessingUid(uid)
      const toggleFn = httpsCallable<{ targetUid: string, disabled: boolean }, { success: boolean, message: string }>(functions, 'adminToggleUserStatus')
      
      const res = await toggleFn({ targetUid: uid, disabled: !currentDisabled })
      
      if (res.data.success) {
        const newDisabledState = !currentDisabled
        toast.success(res.data.message)
        // Optimistically update the list
        mutate(users.map(u => u.uid === uid ? { ...u, disabled: newDisabledState } : u))
        
        if (selectedUser?.uid === uid) {
          setSelectedUser({ ...selectedUser, disabled: newDisabledState })
        }
      }
    } catch (error: any) {
      console.error("Failed to toggle status", error)
      toast.error(error.message || "Failed to update user status.")
    } finally {
      setProcessingUid(null)
    }
  }

  const handleSelectUser = async (user: AdminUserRecord) => {
    setSelectedUser(user)
    setLoadingAccounts(true)
    try {
      const q = query(collection(db, 'users', user.uid, 'accounts'))
      const snap = await getDocs(q)
      const accounts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BankAccount[]
      setUserAccounts(accounts)
    } catch (error) {
      console.error("Failed to load user accounts", error)
      toast.error("Failed to load user accounts")
    } finally {
      setLoadingAccounts(false)
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Users & Accounts Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Master directory of all registered users and their status.
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {selectedUser ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Button variant="ghost" onClick={() => setSelectedUser(null)} className="mb-2 -ml-2 text-muted-foreground">
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Back to Ledger
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Summary */}
            <Card className="p-6 bg-surface border-border flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${selectedUser.disabled ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-xl font-medium text-foreground truncate">{selectedUser.email}</h2>
                  <p className="text-xs text-muted-foreground font-mono truncate">{selectedUser.uid}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mt-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <Badge variant="outline" className={selectedUser.disabled ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}>
                    {selectedUser.disabled ? 'Disabled' : 'Active'}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">KYC</div>
                  <Badge variant="outline" className={selectedUser.kycStatus === 'VERIFIED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>
                    {selectedUser.kycStatus.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Joined</div>
                  <div className="text-sm font-medium">{new Date(selectedUser.creationTime).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Role</div>
                  <div className="text-sm font-medium">{selectedUser.admin ? 'Admin' : 'Customer'}</div>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <Button 
                  variant="outline" 
                  className={`w-full ${selectedUser.disabled ? "border-green-500/50 text-green-500 hover:text-green-400 hover:bg-green-500/10" : "border-destructive/50 text-destructive hover:text-destructive hover:bg-destructive/10"}`}
                  onClick={() => toggleUserStatus(selectedUser.uid, selectedUser.disabled)}
                  disabled={processingUid === selectedUser.uid || selectedUser.admin}
                >
                  {processingUid === selectedUser.uid ? (
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                  ) : selectedUser.disabled ? (
                    <>
                      <ShieldIcon className="w-4 h-4 mr-2" />
                      Enable Account Access
                    </>
                  ) : (
                    <>
                      <ShieldBanIcon className="w-4 h-4 mr-2" />
                      Disable Account Access
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Bank Accounts */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-medium tracking-tight">Bank Accounts ({userAccounts.length})</h3>
              
              {loadingAccounts ? (
                <Card className="p-12 flex items-center justify-center bg-surface border-border">
                  <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
                </Card>
              ) : userAccounts.length === 0 ? (
                <Card className="p-8 text-center bg-surface border-border">
                  <WalletIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h4 className="text-foreground font-medium">No Accounts Found</h4>
                  <p className="text-sm text-muted-foreground mt-1">This user has not been provisioned with any bank accounts yet.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userAccounts.map(account => (
                    <Card key={account.id} className="p-5 bg-surface border-border hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                            {account.currency}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{account.currency} {account.type === 'current' ? 'Current' : 'Reserve'}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{account.accountNumber}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className={account.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>
                          {account.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Available Balance</div>
                        <div className="text-2xl font-medium tracking-tight">
                          {formatCurrency(account.availableBalance, account.currency)}
                        </div>
                        {account.balance !== account.availableBalance && (
                          <div className="text-xs text-muted-foreground pt-1">
                            Ledger Balance: {formatCurrency(account.balance, account.currency)}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Card className="flex-1 bg-surface border-border overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
            <Loader2Icon className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-background/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">User ID / Email</th>
                    <th className="px-6 py-4 font-medium">KYC Status</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Accounts</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr 
                        key={user.uid} 
                        className="hover:bg-background/30 transition-colors cursor-pointer"
                        onClick={() => handleSelectUser(user)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${user.disabled ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{user.email}</div>
                              <div className="text-xs text-muted-foreground font-mono mt-0.5">{user.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="outline" 
                            className={
                              user.kycStatus === 'VERIFIED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              user.kycStatus === 'UNDER_REVIEW' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              user.kycStatus === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                              'bg-muted text-muted-foreground border-border'
                            }
                          >
                            {user.kycStatus.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {user.admin ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                          ) : (
                            <span className="text-muted-foreground">Customer</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <BanknoteIcon className="w-4 h-4 text-muted-foreground" />
                            {user.accountsCount} active
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(user.creationTime).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className={user.disabled ? "text-green-500 hover:text-green-400 hover:bg-green-500/10" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUserStatus(user.uid, user.disabled);
                            }}
                            disabled={processingUid === user.uid || user.admin}
                          >
                            {processingUid === user.uid ? (
                              <Loader2Icon className="w-4 h-4 animate-spin" />
                            ) : user.disabled ? (
                              <>
                                <ShieldIcon className="w-4 h-4 mr-2" />
                                Enable
                              </>
                            ) : (
                              <>
                                <ShieldBanIcon className="w-4 h-4 mr-2" />
                                Disable
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-border overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="px-6 py-12 text-center text-muted-foreground">
                  No users found.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div 
                    key={user.uid} 
                    className="p-4 flex flex-col gap-4 hover:bg-background/30 transition-colors cursor-pointer"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${user.disabled ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-medium text-foreground truncate">{user.email}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{user.uid}</div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={
                                user.kycStatus === 'VERIFIED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                user.kycStatus === 'UNDER_REVIEW' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                user.kycStatus === 'REJECTED' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                'bg-muted text-muted-foreground border-border'
                              }
                            >
                              {user.kycStatus.replace('_', ' ')}
                            </Badge>
                            {user.admin && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-background/50 p-3 rounded-lg border border-border">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Accounts</div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          <BanknoteIcon className="w-4 h-4 text-muted-foreground" />
                          {user.accountsCount} active
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Joined</div>
                        <div className="text-sm font-medium">
                          {new Date(user.creationTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className={`w-full ${user.disabled ? "border-green-500/50 text-green-500 hover:text-green-400 hover:bg-green-500/10" : "border-destructive/50 text-destructive hover:text-destructive hover:bg-destructive/10"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUserStatus(user.uid, user.disabled);
                      }}
                      disabled={processingUid === user.uid || user.admin}
                    >
                      {processingUid === user.uid ? (
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                      ) : user.disabled ? (
                        <>
                          <ShieldIcon className="w-4 h-4 mr-2" />
                          Enable Account
                        </>
                      ) : (
                        <>
                          <ShieldBanIcon className="w-4 h-4 mr-2" />
                          Disable Account
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        </Card>
      )}
    </div>
  )
}
