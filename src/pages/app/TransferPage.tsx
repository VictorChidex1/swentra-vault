import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRightIcon,
  CheckCircle2Icon,
  Loader2Icon,
  ArrowLeftIcon,
  RefreshCcwIcon,
  ClockIcon,
} from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useBeneficiaries } from "@/hooks/useBeneficiaries";
import { useAuth } from "@/hooks/useAuth";
import { useKyc } from "@/hooks/useKyc";
import { initiateTransfer, fetchTransferQuote } from "@/services/transactions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccount } from "@/types/accounts";
import type { Beneficiary } from "@/types/beneficiary";
import type { TransactionType, TransferQuote } from "@/types/transactions";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";
import { cn } from "@/lib/utils";

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatAccount(num: string) {
  return num.replace(/(\d{4})/g, "$1 ").trim();
}

export default function TransferPage() {
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { beneficiaries, isLoading: beneficiariesLoading, addBeneficiary } = useBeneficiaries();
  const { user } = useAuth();
  const { record: kycRecord } = useKyc();

  const kycName = kycRecord?.personalDetails
    ? `${kycRecord.personalDetails.firstName} ${kycRecord.personalDetails.lastName}`.trim()
    : null;
  const accountName = kycName || user?.displayName || "Vault Client";

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Source
  const [sourceAccount, setSourceAccount] = useState<BankAccount | null>(null);

  // Step 2: Destination
  const [destType, setDestType] = useState<"OWN" | "BENEFICIARY" | "NEW">("OWN");
  const [destAccount, setDestAccount] = useState<BankAccount | null>(null);
  const [destBeneficiary, setDestBeneficiary] = useState<Beneficiary | null>(null);
  
  const [newRecipient, setNewRecipient] = useState({
    fullName: "",
    accountNumber: "",
    bankName: "",
    swiftCode: "",
    currency: "USD",
  });

  // Step 3: Amount
  const [amountStr, setAmountStr] = useState("");
  const [reference, setReference] = useState("");

  const [showPinModal, setShowPinModal] = useState(false);
  const [error, setError] = useState("");
  const [txId, setTxId] = useState("");

  const [quote, setQuote] = useState<TransferQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const [payeeSaved, setPayeeSaved] = useState(false);

  useEffect(() => {
    if (step === 4 && quote && timeRemaining > 0) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expires = new Date(quote.expiresAt).getTime();
        const diff = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeRemaining(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, quote, timeRemaining]);

  const loadQuote = async () => {
    if (!sourceAccount) return;
    setQuoteLoading(true);
    setError("");
    
    let type: TransactionType = "EXTERNAL_WIRE";
    let destCurrency = "USD";

    if (destType === "OWN" && destAccount) {
      type = "INTERNAL_TRANSFER";
      destCurrency = destAccount.currency;
    } else if (destType === "BENEFICIARY" && destBeneficiary) {
      type = destBeneficiary.type === "INTERNAL" ? "SWENTRA_TRANSFER" : "EXTERNAL_WIRE";
      destCurrency = destBeneficiary.currency || "USD";
    } else if (destType === "NEW") {
      type = "EXTERNAL_WIRE";
      destCurrency = newRecipient.currency;
    }

    try {
      const q = await fetchTransferQuote({
        sourceAccountId: sourceAccount.id,
        destinationCurrency: destCurrency,
        amount: numericAmount,
        type,
      });
      setQuote(q);
      const diff = Math.max(0, Math.floor((new Date(q.expiresAt).getTime() - new Date().getTime()) / 1000));
      setTimeRemaining(diff);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^\d.]/g, ""); // strip non-numeric and non-dots
    
    if (val) {
      const parts = val.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      if (parts.length > 2) return; // Prevent multiple dots
      val = parts.join('.');
    }
    
    setAmountStr(val);
  };

  const numericAmount = parseFloat(amountStr.replace(/,/g, ""));

  const handleExecute = async () => {
    setError("");
    setShowPinModal(false);

    try {
      let recipientDetails: any = {};

      if (destType === "OWN" && destAccount) {
        recipientDetails = {
          type: "INTERNAL",
          fullName: "Own Account",
          accountNumber: destAccount.accountNumber,
          currency: destAccount.currency,
        };
      } else if (destType === "BENEFICIARY" && destBeneficiary) {
        recipientDetails = {
          type: destBeneficiary.type,
          fullName: destBeneficiary.fullName,
          accountNumber: destBeneficiary.accountNumber,
          bankName: destBeneficiary.bankName,
          swiftCode: destBeneficiary.swiftCode,
          currency: destBeneficiary.currency,
        };
      } else if (destType === "NEW") {
        recipientDetails = {
          type: "EXTERNAL",
          fullName: newRecipient.fullName,
          accountNumber: newRecipient.accountNumber,
          bankName: newRecipient.bankName,
          swiftCode: newRecipient.swiftCode,
          currency: newRecipient.currency,
        };
      }

      const result = await initiateTransfer({
        quoteId: quote!.quoteId,
        recipientDetails,
        reference: reference || "Funds Transfer",
      });

      if (result.success) {
        setTxId(result.transactionId);
        setStep(5);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (accountsLoading || beneficiariesLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6 space-y-8">
      {step < 5 && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">
              Transfer Funds
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Secure wire and internal transfers
            </p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  step >= i ? "bg-primary" : "bg-primary/20",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: SOURCE ACCOUNT */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Select Source Account
          </h2>

          <div className="grid gap-3">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  setSourceAccount(acc);
                  setStep(2);
                }}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-surface/30 hover:bg-surface/50 transition-colors text-left"
              >
                <div>
                  <div className="font-medium text-foreground uppercase">
                    {accountName}
                  </div>
                  <div className="text-[0.65rem] tracking-widest text-primary/80 font-medium mt-1 mb-0.5 uppercase">
                    {acc.currency} {acc.type === "current" ? "Current" : "Reserve"}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {formatAccount(acc.accountNumber)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground">
                    {formatAmount(acc.availableBalance, acc.currency)}
                  </div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: DESTINATION */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setStep(1)}
              className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors"
            >
              <ArrowLeftIcon className="size-4 text-muted-foreground" />
            </button>
            <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Select Recipient
            </h2>
          </div>

          <div className="flex bg-surface/30 p-1 rounded-lg border border-border">
            <button
              onClick={() => setDestType("OWN")}
              className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", destType === "OWN" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              My Accounts
            </button>
            <button
              onClick={() => setDestType("BENEFICIARY")}
              className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", destType === "BENEFICIARY" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Saved Payees
            </button>
            <button
              onClick={() => setDestType("NEW")}
              className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-colors", destType === "NEW" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              New Recipient
            </button>
          </div>

          <div className="space-y-3 pt-4">
            {destType === "OWN" && (
              <div className="space-y-3">
                {accounts.map((acc) => {
                  if (sourceAccount?.id === acc.id) return null;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setDestAccount(acc);
                        setDestBeneficiary(null);
                        setStep(3);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-surface/30 hover:bg-surface/50 transition-colors text-left"
                    >
                      <div>
                        <div className="font-medium">
                          {acc.currency} {acc.type === "current" ? "Current" : "Reserve"}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono mt-0.5">
                          {formatAccount(acc.accountNumber)}
                        </div>
                      </div>
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}

            {destType === "BENEFICIARY" && (
              <div className="space-y-3">
                {beneficiaries.map((ben) => (
                  <button
                    key={ben.id}
                    onClick={() => {
                      setDestBeneficiary(ben);
                      setDestAccount(null);
                      setStep(3);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-surface/30 hover:bg-surface/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {ben.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{ben.fullName}</div>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono">{ben.accountNumber}</span>
                          <span>•</span>
                          <span>{ben.currency}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {destType === "NEW" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name / Company Name</Label>
                    <Input 
                      value={newRecipient.fullName} 
                      onChange={e => setNewRecipient({...newRecipient, fullName: e.target.value})} 
                      placeholder="e.g. John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number / IBAN</Label>
                    <Input 
                      value={newRecipient.accountNumber} 
                      onChange={e => setNewRecipient({...newRecipient, accountNumber: e.target.value})} 
                      placeholder="e.g. 123456789" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input 
                      value={newRecipient.bankName} 
                      onChange={e => setNewRecipient({...newRecipient, bankName: e.target.value})} 
                      placeholder="e.g. Chase Bank" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SWIFT / Routing Code</Label>
                    <Input 
                      value={newRecipient.swiftCode} 
                      onChange={e => setNewRecipient({...newRecipient, swiftCode: e.target.value})} 
                      placeholder="e.g. BOFAUS3N" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newRecipient.currency}
                      onChange={e => setNewRecipient({...newRecipient, currency: e.target.value})}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="CHF">CHF - Swiss Franc</option>
                      <option value="NGN">NGN - Nigerian Naira</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 h-11" 
                  onClick={() => {
                    setDestAccount(null);
                    setDestBeneficiary(null);
                    setStep(3);
                  }}
                  disabled={!newRecipient.fullName || !newRecipient.accountNumber || !newRecipient.bankName}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: AMOUNT */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setStep(2)}
              className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors"
            >
              <ArrowLeftIcon className="size-4 text-muted-foreground" />
            </button>
            <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Amount Details
            </h2>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground font-medium">
                    {sourceAccount?.currency}
                  </span>
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="pl-12 text-lg font-mono h-12"
                />
              </div>
              {numericAmount > (sourceAccount?.availableBalance || 0) && (
                <p className="text-xs text-destructive mt-1">
                  Amount exceeds available balance
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Invoice #1024"
              />
            </div>

            {error && <p className="text-sm text-destructive mt-2">{error}</p>}

            <Button
              className="w-full h-12 mt-6"
              disabled={
                !numericAmount ||
                numericAmount <= 0 ||
                numericAmount > (sourceAccount?.availableBalance || 0) ||
                quoteLoading
              }
              onClick={loadQuote}
            >
              {quoteLoading ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Generating Quote...
                </>
              ) : (
                "Review Transfer"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW */}
      {step === 4 && quote && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setStep(3)}
              className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors"
            >
              <ArrowLeftIcon className="size-4 text-muted-foreground" />
            </button>
            <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Review Transfer
            </h2>
          </div>

          <Card className="p-6 bg-surface/30 border-border space-y-6">
            <div className="text-center pb-6 border-b border-border">
              <div className="text-sm text-muted-foreground mb-2">
                Amount to send
              </div>
              <div className="text-4xl font-light tracking-tight text-foreground">
                {formatAmount(quote.totalDebit, quote.sourceCurrency)}
              </div>
              <div className="flex justify-center items-center gap-2 mt-4 text-xs font-medium text-muted-foreground bg-surface/50 rounded-full py-1.5 px-4 w-max mx-auto">
                <ClockIcon className="size-3.5" />
                {timeRemaining > 0 ? (
                  <span>
                    Quote expires in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                ) : (
                  <span className="text-destructive">Quote expired</span>
                )}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium text-right uppercase">
                  {accountName}
                  <br />
                  <span className="text-muted-foreground font-normal text-xs">
                    {formatAccount(sourceAccount!.accountNumber)}
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium text-right">
                  {destType === "OWN"
                    ? "My Account"
                    : destType === "BENEFICIARY" 
                      ? destBeneficiary?.fullName 
                      : newRecipient.fullName}
                  <br />
                  <span className="text-muted-foreground font-normal text-xs font-mono">
                    {destType === "OWN"
                      ? formatAccount(destAccount!.accountNumber)
                      : destType === "BENEFICIARY"
                        ? destBeneficiary?.accountNumber
                        : newRecipient.accountNumber}
                  </span>
                </span>
              </div>

              {((destType === "BENEFICIARY" && destBeneficiary?.bankName) || (destType === "NEW" && newRecipient.bankName)) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">
                    {destType === "BENEFICIARY" ? destBeneficiary?.bankName : newRecipient.bankName}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-border">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-medium">
                  {quote.exchangeRate === 1.0 
                    ? "1.00 (Same Currency)" 
                    : `1 ${quote.sourceCurrency} = ${quote.exchangeRate.toFixed(4)} ${quote.destinationCurrency}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-4">
                <span className="text-muted-foreground">Recipient Gets</span>
                <span className="font-medium text-foreground">
                  {formatAmount(quote.convertedAmount, quote.destinationCurrency)}
                </span>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">
                  {formatAmount(quote.fee, quote.sourceCurrency)}
                </span>
              </div>
            </div>
          </Card>

          {timeRemaining > 0 ? (
            <Button className="w-full h-12" onClick={() => setShowPinModal(true)}>
              Confirm & Authorize
            </Button>
          ) : (
            <Button className="w-full h-12" variant="outline" onClick={loadQuote} disabled={quoteLoading}>
              <RefreshCcwIcon className={cn("mr-2 size-4", quoteLoading && "animate-spin")} />
              Refresh Quote
            </Button>
          )}
        </div>
      )}

      <PinVerificationModal 
        open={showPinModal} 
        onOpenChange={setShowPinModal} 
        onSuccess={handleExecute} 
      />

      {/* STEP 5: SUCCESS */}
      {step === 5 && (
        <div className="space-y-6 animate-in zoom-in-95 fade-in duration-500 pt-8">
          <div className="text-center space-y-4">
            <div className="mx-auto size-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CheckCircle2Icon className="size-10 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-medium tracking-tight text-foreground">
                Transfer Initiated
              </h2>
              <p className="text-muted-foreground mt-2">
                Your transfer request has been cryptographically signed and
                submitted.
              </p>
            </div>
          </div>

          <Card className="p-6 bg-surface/30 border-border mx-auto max-w-sm mt-8">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {formatAmount(numericAmount, sourceAccount!.currency)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{txId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-primary">
                  {destType === "OWN" || destBeneficiary?.type === "INTERNAL"
                    ? "Completed"
                    : "Processing"}
                </span>
              </div>
            </div>
          </Card>

          {destType === "NEW" && !payeeSaved && (
             <div className="flex flex-col items-center justify-center p-5 bg-primary/5 rounded-lg border border-primary/20 space-y-3 mx-auto max-w-sm mt-4">
               <p className="text-sm text-center">Do you want to save this recipient as a trusted payee for future transfers?</p>
               <Button 
                 variant="secondary" 
                 onClick={async () => {
                   await addBeneficiary({
                     type: 'EXTERNAL',
                     fullName: newRecipient.fullName,
                     accountNumber: newRecipient.accountNumber,
                     bankName: newRecipient.bankName,
                     swiftCode: newRecipient.swiftCode,
                     currency: newRecipient.currency
                   });
                   setPayeeSaved(true);
                 }}
               >
                 Save Payee
               </Button>
             </div>
          )}

          <div className="flex gap-4 pt-6 max-w-sm mx-auto">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/app/transactions")}
            >
              View Activity
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setStep(1);
                setAmountStr("");
                setReference("");
                setSourceAccount(null);
                setDestAccount(null);
                setDestBeneficiary(null);
                setNewRecipient({ fullName: "", accountNumber: "", bankName: "", swiftCode: "", currency: "USD" });
              }}
            >
              New Transfer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
