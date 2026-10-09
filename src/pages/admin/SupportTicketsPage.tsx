import { useState, useMemo, useEffect } from 'react'
import { collection, query, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'
import { type SupportTicket, type TicketStatus } from '@/hooks/useSupportTickets'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2Icon, ShieldCheckIcon, MailIcon, MessagesSquareIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSupportTicket extends SupportTicket {
  userEmail: string
  userName: string
}

export default function SupportTicketsPage() {
  const fetcher = useMemo(() => async () => {
    // We fetch all tickets. In production, we'd add server pagination or limit.
    const q = query(collection(db, 'supportTickets'))
    const snapshot = await getDocs(q)
    
    const fetched: AdminSupportTicket[] = []
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as Omit<SupportTicket, 'id'>
      
      let userEmail = 'Unknown'
      let userName = 'Unknown'
      
      if (data.userId) {
        const userDoc = await getDoc(doc(db, 'users', data.userId))
        if (userDoc.exists()) {
          userEmail = userDoc.data().email
          userName = userDoc.data().displayName || 'Unknown'
        }
      }
      
      fetched.push({ ...data, id: docSnapshot.id, userEmail, userName })
    }
    
    // Sort locally by date descending
    fetched.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0
      const timeB = b.createdAt?.toMillis?.() || 0
      return timeB - timeA
    })
    
    return fetched
  }, [])

  const { data: ticketsData, loading, mutate } = useAdminCache('admin-support-tickets', fetcher)
  const tickets = ticketsData || []

  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [filter, setFilter] = useState<TicketStatus | 'ALL'>('ALL')

  // Auto-select first ticket if none selected
  useEffect(() => {
    if (!selectedTicket && tickets.length > 0) {
      setSelectedTicket(tickets[0])
    }
  }, [tickets, selectedTicket])

  const filteredTickets = tickets.filter(t => filter === 'ALL' || t.status === filter)

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return
    setIsUpdating(true)
    try {
      const ticketRef = doc(db, 'supportTickets', selectedTicket.id)
      await updateDoc(ticketRef, { status: newStatus })
      
      toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`)
      
      // Mutate local cache
      const updatedTickets = tickets.map((t: AdminSupportTicket) => t.id === selectedTicket.id ? { ...t, status: newStatus } : t)
      mutate(updatedTickets)
      
      setSelectedTicket({ ...selectedTicket, status: newStatus })
    } catch (error: any) {
      toast.error('Failed to update ticket: ' + error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "numeric"
    }).format(date)
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2Icon className="size-8 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">Manage client inquiries and secure requests.</p>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'ALL' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('ALL')}>All</Button>
        <Button variant={filter === 'OPEN' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('OPEN')}>Open</Button>
        <Button variant={filter === 'IN_REVIEW' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('IN_REVIEW')}>In Review</Button>
        <Button variant={filter === 'RESOLVED' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('RESOLVED')}>Resolved</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[70vh]">
        {/* LEFT PANE: List */}
        <Card className="md:col-span-4 h-full flex flex-col overflow-hidden bg-surface/30">
          <div className="p-4 border-b border-border bg-surface/50 font-medium text-sm">
            Inbox ({filteredTickets.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  "w-full text-left p-3 rounded-md transition-colors",
                  selectedTicket?.id === ticket.id 
                    ? "bg-primary/10 border border-primary/20" 
                    : "hover:bg-surface/60 border border-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-mono text-muted-foreground line-clamp-1">{ticket.userEmail}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>
                <div className="font-medium text-sm text-foreground line-clamp-1 mb-1">
                  {ticket.subject}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className={cn(
                    "text-[9px] uppercase tracking-wider px-1.5 py-0",
                    ticket.status === 'OPEN' ? "text-warning border-warning/30 bg-warning/5" :
                    ticket.status === 'IN_REVIEW' ? "text-blue-400 border-blue-400/30 bg-blue-400/5" :
                    "text-primary border-primary/30 bg-primary/5"
                  )}>
                    {ticket.status?.replace('_', ' ') || 'OPEN'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{ticket.category?.replace('_', ' ')}</span>
                </div>
              </button>
            ))}
            {filteredTickets.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No tickets found.
              </div>
            )}
          </div>
        </Card>

        {/* RIGHT PANE: Detail */}
        <Card className="md:col-span-8 h-full flex flex-col overflow-hidden bg-surface/30">
          {selectedTicket ? (
            <>
              <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface/20">
                <div>
                  <h2 className="text-lg font-medium text-foreground">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><MailIcon className="size-3.5"/> {selectedTicket.userEmail}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><ShieldCheckIcon className="size-3.5"/> {selectedTicket.category.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isUpdating || selectedTicket.status === 'IN_REVIEW'}
                    onClick={() => handleStatusChange('IN_REVIEW')}
                  >
                    Mark In-Review
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    disabled={isUpdating || selectedTicket.status === 'RESOLVED'}
                    onClick={() => handleStatusChange('RESOLVED')}
                  >
                    {isUpdating ? <Loader2Icon className="size-4 animate-spin" /> : 'Resolve'}
                  </Button>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="bg-surface/50 border border-border rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                    <div className="font-medium text-sm">Client Message</div>
                    <div className="text-xs text-muted-foreground">{formatDate(selectedTicket.createdAt)}</div>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
                    {selectedTicket.message}
                  </div>
                </div>

                {selectedTicket.status === 'RESOLVED' && (
                  <div className="mt-6 flex items-center justify-center p-4 border border-primary/20 bg-primary/5 rounded-lg text-primary text-sm gap-2">
                    <ShieldCheckIcon className="size-4" />
                    Ticket has been securely resolved.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <MessagesSquareIcon className="size-12 opacity-20" />
              <p>Select a ticket to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
