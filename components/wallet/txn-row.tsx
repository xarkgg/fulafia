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
    <div className="flex items-start gap-3 py-3">
      <TxnIcon type={t.type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-[15px] font-medium leading-snug text-ink">{t.description}</p>
          <TxnAmount t={t} className="pt-px text-[15px]" />
        </div>
        {showRef ? (
          <>
            <p className="mt-0.5 truncate text-sm text-muted">{t.category}</p>
            <p className="truncate font-mono text-xs text-subtle">{t.reference}</p>
          </>
        ) : (
          <p className="mt-0.5 truncate text-sm text-muted">
            {formatDate(t.date)} · {t.category}
          </p>
        )}
      </div>
    </div>
  );
}
