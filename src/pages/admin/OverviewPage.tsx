import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminCache } from '@/hooks/useAdminCache'
import {
  UsersIcon,
  ShieldAlertIcon,
  BanknoteIcon,
  ArrowRightLeftIcon,
  ActivityIcon,
  Loader2Icon,
  UserPlusIcon,
  ChevronRightIcon
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  pendingKycCount: number
  totalAccounts: number
  totalTransactions: number
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
  }>
}

export default function OverviewPage() {
  const fetcher = useMemo(() => async () => {
    const getStats = httpsCallable<void, DashboardStats>(functions, 'adminGetDashboardStats')
    const res = await getStats()
    return res.data
  }, [])

  const { data: stats, loading } = useAdminCache('dashboard-stats', fetcher)

  if (loading || !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2Icon className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Initializing Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to the Swentra Vault Command Center. Here is your platform at a glance.
        </p>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border-border flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-semibold mt-1">{stats.totalUsers}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UsersIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className={`p-6 bg-surface border-border flex flex-col gap-4 relative overflow-hidden group ${stats.pendingKycCount > 0 ? 'border-yellow-500/30' : ''}`}>
          {stats.pendingKycCount > 0 && (
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending KYC</p>
              <h3 className="text-3xl font-semibold mt-1">{stats.pendingKycCount}</h3>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.pendingKycCount > 0 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>
              <ShieldAlertIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border-border flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
              <h3 className="text-3xl font-semibold mt-1">{stats.totalAccounts}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <BanknoteIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border-border flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transactions</p>
              <h3 className="text-3xl font-semibold mt-1">{stats.totalTransactions}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ArrowRightLeftIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* QUICK ACTIONS */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Direct jumps to common admin tasks.</p>
          </div>
          
          <div className="grid gap-4">
            <Link to="/admin/kyc">
              <Card className="p-5 flex items-center justify-between bg-surface hover:bg-surface/80 border-border hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldAlertIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Review KYC Queue</div>
                    <div className="text-xs text-muted-foreground">{stats.pendingKycCount} pending applications</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Card>
            </Link>

            <Link to="/admin/users">
              <Card className="p-5 flex items-center justify-between bg-surface hover:bg-surface/80 border-border hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">User & Accounts Ledger</div>
                    <div className="text-xs text-muted-foreground">Manage user access and accounts</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Card>
            </Link>

            <Link to="/admin/funding">
              <Card className="p-5 flex items-center justify-between bg-surface hover:bg-surface/80 border-border hover:border-primary/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <BanknoteIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">Funding Portal</div>
                    <div className="text-xs text-muted-foreground">Deposit or withdraw user funds</div>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Card>
            </Link>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-primary" />
              Live Audit Feed
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Most recent system events.</p>
          </div>

          <Card className="bg-surface border-border overflow-hidden">
            <div className="divide-y divide-border">
              {stats.recentActivity.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No recent activity found.
                </div>
              ) : (
                stats.recentActivity.map((activity, index) => (
                  <div key={`${activity.id}-${index}`} className="p-4 sm:p-6 hover:bg-background/30 transition-colors flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <UserPlusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-1">
                        <div className="font-medium text-foreground truncate">{activity.title}</div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {stats.recentActivity.length > 0 && (
              <div className="p-4 border-t border-border bg-background/30 text-center">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  View Full Audit Log
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
