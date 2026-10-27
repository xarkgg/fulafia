import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate, formatNaira } from "@/lib/format";
import type { WalletTransaction } from "@/lib/types";

export function TxnIcon({ type }: { type: WalletTransaction["type"] }) {
  const credit = type === "credit";
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full",
        credit ? "bg-success-soft text-success" : "bg-surface-2 text-muted",
      )}
      aria-hidden
    >
      {credit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
    </span>
  );
}

export function TxnAmount({ t, className }: { t: WalletTransaction; className?: string }) {
  return (
    <span className={cn("whitespace-nowrap font-semibold tabular", t.type === "credit" ? "text-success" : "text-ink", className)}>
      {t.type === "credit" ? "+" : "−"}
      {formatNaira(t.amount)}
    </span>
  );
}

/** Compact, readable row used on the dashboard and as the mobile card on the wallet page. */
export function TxnRow({ t, showRef }: { t: WalletTransaction; showRef?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <TxnIcon type={t.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{t.description}</p>
        <p className="truncate text-sm text-muted">
          {formatDate(t.date)}
          {showRef ? ` · ${t.reference}` : ` · ${t.category}`}
        </p>
      </div>
      <TxnAmount t={t} className="text-[15px]" />
    </div>
  );
}
