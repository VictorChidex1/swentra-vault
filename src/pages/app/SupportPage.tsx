import { useState } from "react";
import { useSupportTickets, type TicketCategory } from "@/hooks/useSupportTickets";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheckIcon, PhoneIcon, MailIcon, ClockIcon, MessagesSquareIcon, ExternalLinkIcon, CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  const { tickets, createTicket, loading } = useSupportTickets();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    category: "GENERAL" as TicketCategory,
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createTicket(formData);
      setSuccess(true);
      setFormData({ category: "GENERAL", subject: "", message: "" });
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date();
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  return (
    <div className="mx-auto max-w-5xl py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Vault Support
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Secure communication channel with your dedicated Private Banker.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: CONCIERGE & FAQS */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-surface/30 backdrop-blur-sm border-border">
            <div className="text-center mb-6">
              <div className="relative mx-auto size-24 mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&h=256&auto=format&fit=crop" 
                  alt="Private Banker" 
                  className="rounded-full object-cover border-2 border-primary/20 size-24"
                />
                <div className="absolute bottom-0 right-0 size-4 bg-primary rounded-full border-2 border-surface" />
              </div>
              <h3 className="font-medium text-foreground text-lg">Jonathan Hayes</h3>
              <p className="text-sm text-muted-foreground">Senior Wealth Manager</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <PhoneIcon className="size-4 text-muted-foreground" />
                <a href="tel:+41445551234" className="font-mono text-foreground hover:text-primary transition-colors hover:underline">
                  +41 44 555 1234
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MailIcon className="size-4 text-muted-foreground" />
                <a href="mailto:j.hayes@swentra.com" className="text-foreground hover:text-primary transition-colors hover:underline">
                  j.hayes@swentra.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ClockIcon className="size-4 text-muted-foreground" />
                <span className="text-foreground">Available Mon-Fri, 9am-6pm CET</span>
              </div>
            </div>

            <Button className="w-full mt-6" variant="outline" onClick={() => window.location.href = "mailto:j.hayes@swentra.com"}>
              Schedule a Call
            </Button>
          </Card>

          {/* Quick FAQs */}
          <Card className="p-6 bg-surface/30 backdrop-blur-sm border-border">
            <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase mb-4">
              Frequent Inquiries
            </h3>
            <div className="space-y-4">
              <a href="#" className="group flex items-center justify-between text-sm hover:text-primary transition-colors">
                <span>International wire cutoff times</span>
                <ExternalLinkIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="#" className="group flex items-center justify-between text-sm hover:text-primary transition-colors">
                <span>Increasing transfer limits</span>
                <ExternalLinkIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="#" className="group flex items-center justify-between text-sm hover:text-primary transition-colors">
                <span>Update KYC / Identity Documents</span>
                <ExternalLinkIcon className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: TICKET SYSTEM */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 md:p-8 bg-surface/30 backdrop-blur-sm border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-foreground">Secure Request</h2>
                <p className="text-sm text-muted-foreground">All communications are end-to-end encrypted.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
                    required
                  >
                    <option value="GENERAL">General Inquiry</option>
                    <option value="TRANSFER_ISSUE">Transfer / Wire Issue</option>
                    <option value="ACCOUNT_LIMITS">Account Limits</option>
                    <option value="SECURITY">Security / Fraud</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input 
                    placeholder="e.g. Wire transfer delay" 
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Secure Message</Label>
                <textarea 
                  placeholder="Describe your issue in detail..." 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  value={formData.message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-11">
                {isSubmitting ? "Encrypting & Sending..." : (
                  <>
                    <MessagesSquareIcon className="mr-2 size-4" />
                    Submit Secure Request
                  </>
                )}
              </Button>

              {success && (
                <div className="flex items-center gap-2 text-sm text-primary mt-2 animate-in fade-in zoom-in">
                  <CheckCircle2Icon className="size-4" />
                  Your request has been securely submitted.
                </div>
              )}
            </form>
          </Card>

          {/* ACTIVE REQUESTS */}
          <div className="pt-4">
            <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase mb-4">
              Your Request History
            </h2>
            
            <div className="space-y-3">
              {loading ? (
                <div className="p-6 text-center text-sm text-muted-foreground bg-surface/30 rounded-lg border border-border">
                  Loading history...
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground bg-surface/30 rounded-lg border border-border border-dashed">
                  No active or past requests found.
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="p-5 rounded-lg border border-border bg-surface/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                          ticket.status === 'OPEN' ? "bg-warning/10 text-warning border border-warning/20" :
                          ticket.status === 'IN_REVIEW' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-primary/10 text-primary border border-primary/20"
                        )}>
                          {ticket.status?.replace('_', ' ') || 'OPEN'}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                      </div>
                      <h4 className="font-medium text-foreground">{ticket.subject}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {ticket.category?.replace('_', ' ') || 'GENERAL'} • {ticket.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
