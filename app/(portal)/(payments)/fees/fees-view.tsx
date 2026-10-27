"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronDown, Download, FileText, Info, ReceiptText } from "lucide-react";
import { getFees, getInvoices, getTerm } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatDate, formatNaira } from "@/lib/format";
import { printHref } from "@/lib/print";
import { cn } from "@/lib/cn";
import type { Fee, FeeCategory, Invoice } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, Skeleton, SkeletonCard } from "@/components/ui/states";
import { FeeStatusBadge, InvoiceStatusBadge } from "@/components/status";
import { PaySheet } from "@/components/pay-sheet";

const CATEGORY_LABEL: Record<FeeCategory, string> = {
  school: "School fee",
  standalone: "Standalone",
  association: "Association dues",
};

export function FeesView() {
  const term = useAsync(getTerm);
  const [category, setCategory] = useState<FeeCategory>("school");
  const [chosenSession, setSession] = useState<string>();
  const session = chosenSession ?? term.data?.current.session;

  const fees = useAsync(() => (session ? getFees({ session, category }) : new Promise<Fee[]>(() => {})), [session, category]);
  const invoices = useAsync(() => (session ? getInvoices({ session }) : new Promise<Invoice[]>(() => {})), [session]);
  const [paying, setPaying] = useState<Fee | null>(null);

  const list = fees.data ?? [];
  const billed = list.filter((f) => f.status !== "upcoming" && !(f.optional && f.status !== "paid"));
  const paid = billed.reduce((s, f) => s + f.amountPaid, 0);
  const outstanding = billed.filter((f) => f.status === "unpaid").reduce((s, f) => s + f.total - f.amountPaid, 0);

  return (
    <>
      <PageHeader title="Fees" description="View what you owe, pay online and download receipts." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs<FeeCategory>
          label="Fee category"
          value={category}
          onChange={setCategory}
          items={(Object.keys(CATEGORY_LABEL) as FeeCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
        />
        {term.data ? (
          <Select
            className="sm:w-52"
            aria-label="Session"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            options={term.data.sessions.map((s) => ({
              value: s,
              label: s === term.data!.current.session ? `${s} (current)` : s,
            }))}
          />
        ) : (
          <Skeleton className="h-11 sm:w-52" />
        )}
      </div>

      {term.error || fees.error ? (
        <ErrorState onRetry={() => (term.error ? term.reload() : fees.reload())} />
      ) : fees.loading && !fees.data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
          <SkeletonCard lines={4} />
        </div>
      ) : (
        <div className={cn("space-y-5 transition-opacity", fees.loading && "opacity-60")}>
          {category !== "standalone" && (
            <section aria-label="Summary" className="grid grid-cols-3 gap-2 sm:gap-4">
              <Summary label="Billed" value={formatNaira(paid + outstanding)} />
              <Summary label="Paid" value={formatNaira(paid)} tone="success" />
              <Summary label="Outstanding" value={formatNaira(outstanding)} tone={outstanding > 0 ? "warning" : undefined} />
            </section>
          )}
          {category === "standalone" && (
            <p className="flex items-start gap-2 rounded-xl bg-info-soft p-3.5 text-sm text-ink/80">
              <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
              Standalone fees are optional. Pay only for the services you need, such as hostel accommodation or a transcript.
            </p>
          )}

          {list.length === 0 ? (
            <Card>
              <EmptyState
                icon={<ReceiptText />}
                title={`No ${CATEGORY_LABEL[category].toLowerCase()} for ${session}`}
                description="Nothing has been billed under this category for the selected session."
              />
            </Card>
          ) : (
            <ul className="space-y-3">
              {list.map((f) => (
                <li key={f.id}>
                  <FeeCard fee={f} onPay={() => setPaying(f)} />
                </li>
              ))}
            </ul>
          )}

          <InvoiceList q={invoices} session={session ?? ""} />
        </div>
      )}

      <PaySheet
        fee={paying}
        onClose={() => setPaying(null)}
        onPaid={() => {
          fees.reload();
          invoices.reload();
        }}
      />
    </>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-card sm:p-5">
      <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
      <p
        className={cn(
          "mt-1 text-[13px] font-semibold tracking-tight tabular min-[400px]:text-[15px] sm:text-2xl",
          tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FeeCard({ fee, onPay }: { fee: Fee; onPay: () => void }) {
  const [open, setOpen] = useState(fee.status === "unpaid" && fee.category === "school");
  const id = `fee-${fee.id}`;
  return (
    <Card className={cn(fee.status === "unpaid" && !fee.optional && "border-warning/30")}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">{fee.title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <FeeStatusBadge status={fee.status} />
              {fee.optional && <Badge>Optional</Badge>}
              {fee.dueDate && fee.status === "unpaid" && (
                <span className="flex items-center gap-1 text-xs text-muted">
                  <CalendarClock className="size-3.5" aria-hidden /> Due {formatDate(fee.dueDate)}
                </span>
              )}
              {fee.paidAt && <span className="text-xs text-muted">Paid {formatDate(fee.paidAt)}</span>}
            </div>
          </div>
          <p className="text-xl font-semibold tracking-tight text-ink tabular">{formatNaira(fee.total)}</p>
        </div>

        {fee.note && fee.status !== "paid" && <p className="mt-3 text-sm text-muted">{fee.note}</p>}

        {fee.items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={id}
              className="pressable mt-3 flex items-center gap-1 rounded-md text-sm font-medium text-gold-strong"
            >
              {open ? "Hide" : "Show"} breakdown ({fee.items.length} items)
              <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
            </button>
            {open && (
              <ul id={id} className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface-2/50 px-3.5 text-sm">
                {fee.items.map((i) => (
                  <li key={i.code} className="flex justify-between gap-3 py-2.5">
                    <span className="text-muted">{i.name}</span>
                    <span className="font-medium text-ink tabular">{formatNaira(i.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {fee.status !== "upcoming" && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-5">
          {fee.status === "paid" ? (
            <Link
              href={printHref.fee(fee.id)}
              className="pressable inline-flex h-9 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-2"
            >
              <Download className="size-4" aria-hidden /> Receipt
            </Link>
          ) : (
            <>
              <Link
                href={printHref.fee(fee.id)}
                className="pressable inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-ink"
              >
                <FileText className="size-4" aria-hidden /> Invoice
              </Link>
              <Button size="sm" onClick={onPay} className="min-w-28">
                Pay {formatNaira(fee.total)}
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function InvoiceList({ q, session }: { q: ReturnType<typeof useAsync<Invoice[]>>; session: string }) {
  return (
    <Card>
      <CardHeader title="Invoices" description={`Every payment reference generated in ${session}`} />
      <CardBody className="pt-3 sm:pt-3">
        {q.error ? (
          <ErrorState onRetry={q.reload} className="border-0" />
        ) : !q.data ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : q.data.length === 0 ? (
          <EmptyState icon={<FileText />} title="No invoices yet" description="An invoice is created each time you start a payment." className="py-6" />
        ) : (
          <ul className="divide-y divide-border">
            {q.data.map((inv) => (
              <li key={inv.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{inv.title}</p>
                  <p className="truncate text-sm text-muted">
                    <span className="font-mono text-[13px]">{inv.rrr}</span> · {inv.channel} · {formatDate(inv.createdAt)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <InvoiceStatusBadge status={inv.status} />
                  <span className="ml-auto text-right font-semibold text-ink tabular sm:ml-0 sm:w-28">{formatNaira(inv.amount)}</span>
                  {inv.status === "pending" ? (
                    <Link href="/self-service" className="pressable rounded-md text-sm font-medium text-gold-strong hover:underline">
                      Verify
                    </Link>
                  ) : (
                    <Link href={printHref.invoice(inv.id)} className="pressable rounded-md text-sm font-medium text-gold-strong hover:underline">
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
