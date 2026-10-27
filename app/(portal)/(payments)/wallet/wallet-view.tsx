"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Info, Search, Wallet as WalletIcon } from "lucide-react";
import { getWallet } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatDate, formatNaira } from "@/lib/format";
import type { WalletTransaction } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";
import { TxnAmount, TxnIcon, TxnRow } from "@/components/wallet/txn-row";

type Filter = "all" | "credit" | "debit";

export function WalletView() {
  const q = useAsync(getWallet);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const txns = useMemo(() => {
    const s = query.trim().toLowerCase();
    return (q.data?.transactions ?? []).filter(
      (t) =>
        (filter === "all" || t.type === filter) &&
        (!s || t.description.toLowerCase().includes(s) || t.reference.toLowerCase().includes(s) || t.category.toLowerCase().includes(s)),
    );
  }, [q.data, filter, query]);

  const byDay = useMemo(() => {
    const groups = new Map<string, WalletTransaction[]>();
    txns.forEach((t) => {
      const k = formatDate(t.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
      groups.set(k, [...(groups.get(k) ?? []), t]);
    });
    return [...groups.entries()];
  }, [txns]);

  if (q.error) return <ErrorState onRetry={q.reload} />;

  return (
    <>
      <PageHeader title="Wallet" description="Your funding and every payment made from your student wallet." />

      {!q.data ? (
        <div className="space-y-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={6} />
        </div>
      ) : (
        <div className="space-y-5">
          <section aria-label="Wallet summary" className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-2xl bg-[#0b1f3a] p-5 text-white shadow-card dark:border dark:border-border dark:bg-surface-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/70">Available balance</p>
                <WalletIcon className="size-4 text-[#d8b54a]" aria-hidden />
              </div>
              <p className="mt-2 text-[28px] font-semibold leading-tight tracking-tight tabular">{formatNaira(q.data.balance)}</p>
              <p className="mt-1 text-sm text-white/60">Ready to pay fees instantly</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:gap-4">
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <ArrowDownLeft className="size-4 text-success" aria-hidden /> Total credits
                </div>
                <p className="mt-2 text-lg font-semibold tracking-tight text-ink tabular sm:text-2xl">{formatNaira(q.data.totalCredit)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-muted">
                  <ArrowUpRight className="size-4 text-muted" aria-hidden /> Total debits
                </div>
                <p className="mt-2 text-lg font-semibold tracking-tight text-ink tabular sm:text-2xl">{formatNaira(q.data.totalDebit)}</p>
              </div>
            </div>
          </section>

          <p className="flex items-start gap-2 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Your wallet is funded by NELFUND disbursements and university refunds. Choose “Wallet” when paying a fee to use it.
          </p>

          <Card>
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <Tabs<Filter>
                label="Transaction type"
                value={filter}
                onChange={setFilter}
                items={[
                  { value: "all", label: "All" },
                  { value: "credit", label: "Credits" },
                  { value: "debit", label: "Debits" },
                ]}
              />
              <Input
                aria-label="Search transactions"
                type="search"
                enterKeyHint="search"
                placeholder="Search description or reference"
                leading={<Search className="size-4" />}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="sm:w-72"
              />
            </div>

            {txns.length === 0 ? (
              <EmptyState
                icon={<Search />}
                title={q.data.transactions.length ? "No matching transactions" : "No transactions yet"}
                description={q.data.transactions.length ? "Try a different search or filter." : "Funding and payments will appear here."}
              />
            ) : (
              <>
                {/* Mobile: readable cards grouped by day */}
                <div className="md:hidden">
                  {byDay.map(([day, items]) => (
                    <section key={day} className="px-4">
                      <h3 className="sticky top-14 z-[1] -mx-4 bg-surface-2/95 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-subtle backdrop-blur">
                        {day}
                      </h3>
                      <div className="divide-y divide-border">
                        {items.map((t) => (
                          <TxnRow key={t.id} t={t} showRef />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-subtle">
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">Description</th>
                        <th className="px-5 py-3 font-semibold">Reference</th>
                        <th className="px-5 py-3 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {txns.map((t) => (
                        <tr key={t.id} className="hover:bg-surface-2/60">
                          <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(t.date)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <TxnIcon type={t.type} />
                              <div className="min-w-0">
                                <p className="font-medium text-ink">{t.description}</p>
                                <p className="text-xs text-muted">{t.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 font-mono text-[13px] text-muted">{t.reference}</td>
                          <td className="px-5 py-3 text-right">
                            <TxnAmount t={t} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
