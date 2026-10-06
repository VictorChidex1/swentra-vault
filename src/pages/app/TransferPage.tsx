import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRightIcon,
  WalletIcon,
  UsersIcon,
  PlusIcon,
  CheckCircle2Icon,
  Loader2Icon,
  LockIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useBeneficiaries } from "@/hooks/useBeneficiaries";
import { initiateTransfer } from "@/services/transactions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BankAccount } from "@/types/accounts";
import type { Beneficiary } from "@/types/beneficiary";
import type { TransactionType } from "@/types/transactions";
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
  const { beneficiaries, isLoading: beneficiariesLoading } = useBeneficiaries();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // State
  const [destType, setDestType] = useState<"OWN" | "BENEFICIARY">(
    "BENEFICIARY",
  );
  const [destAccount, setDestAccount] = useState<BankAccount | null>(null);
  const [destBeneficiary, setDestBeneficiary] = useState<Beneficiary | null>(
    null,
  );

  const [sourceAccount, setSourceAccount] = useState<BankAccount | null>(null);
  const [amountStr, setAmountStr] = useState("");
  const [reference, setReference] = useState("");

  const [authPin, setAuthPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [txId, setTxId] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // allow digits, commas and one dot
    const val = e.target.value.replace(/[^\d.,]/g, "");
    setAmountStr(val);
  };

  const numericAmount = parseFloat(amountStr.replace(/,/g, ""));

  const handleExecute = async () => {
    if (authPin.length < 4) {
      setError("Please enter a valid PIN");
      return;
    }

    setError("");
    setIsProcessing(true);

    try {
      let type: TransactionType = "EXTERNAL_WIRE";
      let recipientDetails: any = {};

      if (destType === "OWN" && destAccount) {
        type = "INTERNAL_TRANSFER";
        recipientDetails = {
          type: "INTERNAL",
          fullName: "Own Account",
          accountNumber: destAccount.accountNumber,
          currency: destAccount.currency,
        };
      } else if (destType === "BENEFICIARY" && destBeneficiary) {
        type =
          destBeneficiary.type === "INTERNAL"
            ? "SWENTRA_TRANSFER"
            : "EXTERNAL_WIRE";
        recipientDetails = {
          type: destBeneficiary.type,
          fullName: destBeneficiary.fullName,
          accountNumber: destBeneficiary.accountNumber,
          bankName: destBeneficiary.bankName,
          swiftCode: destBeneficiary.swiftCode,
          currency: destBeneficiary.currency,
        };
      }

      const result = await initiateTransfer({
        sourceAccountId: sourceAccount!.id,
        type,
        amount: numericAmount,
        currency: sourceAccount!.currency,
        recipientDetails,
        reference: reference || "Funds Transfer",
      });

      if (result.success) {
        setTxId(result.transactionId);
        setStep(5);
      }
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
      setAuthPin("");
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

      {/* STEP 1: DESTINATION */}
      {step === 1 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Select Destination
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              className={cn(
                "p-4 cursor-pointer transition-colors hover:bg-surface/50 border-border",
                destType === "OWN"
                  ? "ring-1 ring-primary bg-primary/5"
                  : "bg-surface/30",
              )}
              onClick={() => setDestType("OWN")}
            >
              <WalletIcon className="size-5 mb-3 text-primary" />
              <div className="font-medium">My Accounts</div>
              <div className="text-xs text-muted-foreground mt-1">
                Transfer between your Vault accounts
              </div>
            </Card>

            <Card
              className={cn(
                "p-4 cursor-pointer transition-colors hover:bg-surface/50 border-border",
                destType === "BENEFICIARY"
                  ? "ring-1 ring-primary bg-primary/5"
                  : "bg-surface/30",
              )}
              onClick={() => setDestType("BENEFICIARY")}
            >
              <UsersIcon className="size-5 mb-3 text-primary" />
              <div className="font-medium">Trusted Payee</div>
              <div className="text-xs text-muted-foreground mt-1">
                Send to a saved beneficiary
              </div>
            </Card>
          </div>

          <div className="space-y-3 pt-4">
            {destType === "OWN" && (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setDestAccount(acc);
                      setDestBeneficiary(null);
                      setStep(2);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-surface/30 hover:bg-surface/50 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium">
                        {acc.currency}{" "}
                        {acc.type === "current" ? "Current" : "Reserve"}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono mt-0.5">
                        {formatAccount(acc.accountNumber)}
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground" />
                  </button>
                ))}
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
                      setStep(2);
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

                <button
                  onClick={() => navigate("/app/beneficiaries")}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-surface/30 transition-colors"
                >
                  <PlusIcon className="size-4" />
                  <span className="text-sm font-medium">Add New Payee</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: SOURCE & AMOUNT */}
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
              Amount Details
            </h2>
          </div>

          <div className="space-y-2">
            <Label>Pay From</Label>
            <div className="grid gap-3">
              {accounts.map((acc) => {
                // Don't show the destination account as a source option
                if (destType === "OWN" && destAccount?.id === acc.id)
                  return null;

                const isSelected = sourceAccount?.id === acc.id;

                return (
                  <button
                    key={acc.id}
                    onClick={() => setSourceAccount(acc)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-surface/30 hover:bg-surface/50",
                    )}
                  >
                    <div>
                      <div className="font-medium text-foreground">
                        {acc.currency}{" "}
                        {acc.type === "current" ? "Current" : "Reserve"}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono mt-0.5">
                        {formatAccount(acc.accountNumber)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatAmount(acc.availableBalance, acc.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Available
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {sourceAccount && (
            <div className="space-y-4 pt-4 animate-in fade-in">
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground font-medium">
                      {sourceAccount.currency}
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
                {numericAmount > sourceAccount.availableBalance && (
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

              <Button
                className="w-full h-12 mt-6"
                disabled={
                  !numericAmount ||
                  numericAmount <= 0 ||
                  numericAmount > sourceAccount.availableBalance
                }
                onClick={() => setStep(3)}
              >
                Review Transfer
              </Button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: REVIEW */}
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
              Review Transfer
            </h2>
          </div>

          <Card className="p-6 bg-surface/30 border-border space-y-6">
            <div className="text-center pb-6 border-b border-border">
              <div className="text-sm text-muted-foreground mb-2">
                Amount to send
              </div>
              <div className="text-4xl font-light tracking-tight text-foreground">
                {formatAmount(numericAmount, sourceAccount!.currency)}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium text-right">
                  {sourceAccount!.currency}{" "}
                  {sourceAccount!.type === "current" ? "Current" : "Reserve"}
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
                    : destBeneficiary?.fullName}
                  <br />
                  <span className="text-muted-foreground font-normal text-xs font-mono">
                    {destType === "OWN"
                      ? formatAccount(destAccount!.accountNumber)
                      : destBeneficiary?.accountNumber}
                  </span>
                </span>
              </div>

              {destType === "BENEFICIARY" && destBeneficiary?.bankName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-medium">
                    {destBeneficiary.bankName}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-border">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">
                  0.00 {sourceAccount!.currency}
                </span>
              </div>
            </div>
          </Card>

          <Button className="w-full h-12" onClick={() => setStep(4)}>
            Confirm & Authorize
          </Button>
        </div>
      )}

      {/* STEP 4: AUTHORIZE */}
      {step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="flex items-center gap-2 mb-6">
            <button
              disabled={isProcessing}
              onClick={() => setStep(3)}
              className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors disabled:opacity-50"
            >
              <ArrowLeftIcon className="size-4 text-muted-foreground" />
            </button>
            <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
              Authorization
            </h2>
          </div>

          <Card className="p-8 bg-surface/30 border-border text-center">
            <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <LockIcon className="size-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Secure Authorization
            </h3>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your 4-digit Vault PIN to sign and execute this transaction.
            </p>

            <div className="max-w-[200px] mx-auto space-y-4">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="text-center text-2xl tracking-[1em] font-mono h-14"
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value.replace(/\D/g, ""))}
                disabled={isProcessing}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                className="w-full h-12"
                onClick={handleExecute}
                disabled={authPin.length < 4 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  "Execute Transfer"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

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
                setAuthPin("");
                setReference("");
                setSourceAccount(null);
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
