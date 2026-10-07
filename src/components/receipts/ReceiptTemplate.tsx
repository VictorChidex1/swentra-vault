import React from 'react'
import type { Transaction } from '@/types/transactions'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateStr: any) {
  if (!dateStr) return "";
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

interface ReceiptTemplateProps {
  transaction: Transaction
  forwardRef?: React.Ref<HTMLDivElement>
}

export function ReceiptTemplate({ transaction, forwardRef }: ReceiptTemplateProps) {
  const isIncoming = transaction.amount > 0
  const absAmount = Math.abs(transaction.amount)
  
  return (
    <div 
      ref={forwardRef}
      className="bg-white text-black p-8 sm:p-12 font-sans w-[800px] shrink-0"
      style={{
        width: '800px', // Fixed width for consistent PDF generation
        minHeight: '1000px',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <img src="/assets/swentra-vault-logo.png" alt="Swentra Vault Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">Swentra Vault</h1>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Global Private Banking</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black text-black">RECEIPT</h2>
          <p className="font-mono text-sm text-gray-500 mt-1">
            TXN: {transaction.id.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Main Details */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Transaction Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date & Time</p>
              <p className="font-mono text-sm font-medium">
                {formatDate(transaction.createdAt as any)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reference</p>
              <p className="font-mono text-sm font-medium">{transaction.reference || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <p className="font-mono text-sm font-medium">{transaction.status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Type</p>
              <p className="font-mono text-sm font-medium">{transaction.type.replace(/_/g, ' ')}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Account Information</h3>
          <div className="space-y-4">
            {isIncoming ? (
              <>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sender</p>
                  <p className="font-mono text-sm font-medium">{transaction.sourceDetails?.senderName || 'External Transfer'}</p>
                  {transaction.sourceDetails?.senderId && (
                    <p className="font-mono text-xs text-gray-400">ID: {transaction.sourceDetails.senderId}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Credited To</p>
                  <p className="font-mono text-sm font-medium">Swentra Vault Account</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Debited From</p>
                  <p className="font-mono text-sm font-medium">Swentra Vault Account</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recipient</p>
                  <p className="font-mono text-sm font-medium">
                    {transaction.recipientDetails?.fullName || transaction.recipientDetails?.bankName || 'Unknown Recipient'}
                  </p>
                  {transaction.recipientDetails?.accountNumber && (
                    <p className="font-mono text-xs text-gray-400">ACC: {transaction.recipientDetails.accountNumber}</p>
                  )}
                  {transaction.recipientDetails?.swiftCode && (
                    <p className="font-mono text-xs text-gray-400">SWIFT: {transaction.recipientDetails.swiftCode}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="bg-gray-50 border border-gray-200 p-8 rounded mb-16">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              {isIncoming ? 'Total Credited Amount' : 'Total Debited Amount'}
            </p>
            <p className="text-5xl font-black tracking-tight">
              {formatCurrency(absAmount, transaction.currency as any)}
            </p>
          </div>
          <div className="text-right">
            {transaction.exchangeRate && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Exchange Rate</p>
                <p className="font-mono text-sm font-medium">{transaction.exchangeRate}</p>
              </div>
            )}
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Currency</p>
            <p className="font-mono text-xl font-bold">{transaction.currency}</p>
          </div>
        </div>
      </div>

      {/* Footer / Legal */}
      <div className="border-t border-gray-200 pt-8 flex justify-between items-end">
        <div className="max-w-sm">
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            This document serves as an official cryptographic receipt generated by Swentra Vault. 
            All transactions are subject to internal audit and Swiss banking compliance regulations.
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
            VERIFIED BY SWENTRA VAULT • {new Date().toISOString()}
          </p>
        </div>
        
        {/* Fake Barcode / Hash for Aesthetics */}
        <div className="text-right">
          <div className="font-mono text-[8px] tracking-tighter text-gray-300 w-48 break-all leading-[0.8] mb-2 opacity-50">
            {Array(5).fill(transaction.id).join('').substring(0, 150)}
          </div>
          <div className="h-12 w-48 bg-black opacity-10" />
        </div>
      </div>
    </div>
  )
}
