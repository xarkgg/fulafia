"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, CreditCard, Download, Wallet as WalletIcon } from "lucide-react";
import { getWallet, payFee } from "@/lib/api";
import { errorMessage } from "@/lib/use-async";
import { formatNaira } from "@/lib/format";
import { printHref } from "@/lib/print";
import { cn } from "@/lib/cn";
import type { Fee, PaymentMethod, PaymentResult } from "@/lib/types";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Notice, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

export function PaySheet({ fee, onClose, onPaid }: { fee: Fee | null; onClose: () => void; onPaid: (r: PaymentResult) => void }) {
  const toast = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("wallet");
  const [state, setState] = useState<"idle" | "paying" | "done">("idle");
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<PaymentResult>();

  useEffect(() => {
    if (!fee) return;
    setState("idle");
    setError(undefined);
    setResult(undefined);
    setBalance(null);
    getWallet()
      .then((w) => {
        setBalance(w.balance);
        setMethod(w.balance >= fee.total ? "wallet" : "remita");
      })
      .catch(() => {
        setBalance(0);
        setMethod("remita");
      });
  }, [fee]);

  if (!fee) return null;
  const enough = balance !== null && balance >= fee.total;

  async function pay() {
    if (!fee) return;
    setError(undefined);
    setState("paying");
    try {
      const r = await payFee(fee.id, method);
      setResult(r);
      setState("done");
      onPaid(r);
      toast.success("Payment successful", `${fee.title} · ${formatNaira(fee.total)}`);
    } catch (e) {
      setError(errorMessage(e));
      setState("idle");
    }
  }

  return (
    <Sheet
      open={!!fee}
      onClose={state === "paying" ? () => {} : onClose}
      title={state === "done" ? "Payment complete" : "Confirm payment"}
      description={state === "done" ? undefined : `${fee.title} · ${fee.session}`}
      footer={
        state === "done" ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
            {result && (
              <Link
                href={printHref.invoice(result.invoice.id)}
                className="pressable inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#0b1f3a] px-4 text-[15px] font-medium text-white dark:bg-gold dark:text-[#0b1424]"
              >
                <Download className="size-4" /> View receipt
              </Link>
            )}
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={state === "paying"}>
              Cancel
            </Button>
            <Button onClick={pay} loading={state === "paying"} disabled={balance === null || (method === "wallet" && !enough)}>
              {state === "paying" ? (method === "remita" ? "Contacting Remita…" : "Processing…") : `Pay ${formatNaira(fee.total)}`}
            </Button>
          </>
        )
      }
    >
      {state === "done" && result ? (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <CircleCheck className="size-7" aria-hidden />
          </span>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-ink tabular">{formatNaira(result.invoice.amount)}</p>
          <p className="mt-1 text-sm text-muted">
            Paid via {result.invoice.channel} · Ref {result.invoice.rrr}
          </p>
          {result.invoice.channel === "Wallet" && (
            <p className="mt-3 rounded-full bg-surface-2 px-3 py-1 text-sm text-muted">
              New wallet balance: <strong className="text-ink tabular">{formatNaira(result.walletBalance)}</strong>
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          <div className="rounded-xl border border-border bg-surface-2/60 p-3.5">
            <ul className="space-y-1.5 text-sm">
              {fee.items.map((i) => (
                <li key={i.code} className="flex justify-between gap-3">
                  <span className="text-muted">{i.name}</span>
                  <span className="text-ink tabular">{formatNaira(i.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold">
              <span className="text-ink">Total</span>
              <span className="text-ink tabular">{formatNaira(fee.total)}</span>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Pay with</legend>
            <div className="space-y-2">
              <MethodOption
                checked={method === "wallet"}
                onSelect={() => setMethod("wallet")}
                disabled={balance !== null && !enough}
                icon={<WalletIcon className="size-5" />}
                title="Wallet"
                subtitle={
                  balance === null ? (
                    <Skeleton className="mt-1 h-3.5 w-32" />
                  ) : enough ? (
                    `Balance ${formatNaira(balance)} · instant`
                  ) : (
                    `Balance ${formatNaira(balance)} · not enough`
                  )
                }
              />
              <MethodOption
                checked={method === "remita"}
                onSelect={() => setMethod("remita")}
                icon={<CreditCard className="size-5" />}
                title="Remita"
                subtitle="Card, bank transfer or USSD"
              />
            </div>
          </fieldset>

          {error && (
            <Notice tone="danger" title="Payment didn't go through">
              {error}
            </Notice>
          )}
          <p className="text-xs text-subtle">Demo build: no real money moves. Payments update your fee record, wallet and receipts.</p>
        </div>
      )}
    </Sheet>
  );
}

function MethodOption({
  checked,
  onSelect,
  disabled,
  icon,
  title,
  subtitle,
}: {
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "pressable flex cursor-pointer items-center gap-3 rounded-xl border p-3.5",
        checked ? "border-gold bg-gold-soft ring-1 ring-gold" : "border-border bg-surface hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-55",
      )}
    >
      <input type="radio" name="method" className="sr-only" checked={checked} onChange={onSelect} disabled={disabled} />
      <span className={cn("grid size-10 place-items-center rounded-lg", checked ? "bg-surface text-gold-strong" : "bg-surface-2 text-muted")}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-muted">{subtitle}</span>
      </span>
      <span
        className={cn("grid size-5 place-items-center rounded-full border-2", checked ? "border-gold" : "border-border-strong")}
        aria-hidden
      >
        {checked && <span className="size-2.5 rounded-full bg-gold" />}
      </span>
    </label>
  );
}
