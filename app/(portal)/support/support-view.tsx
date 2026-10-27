"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Inbox, MessageSquarePlus, Search } from "lucide-react";
import { getTickets } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { relativeTime } from "@/lib/format";
import { whatsappLink } from "@/lib/config";
import type { TicketCategory, TicketStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { TicketStatusBadge } from "@/components/status";
import { WhatsAppIcon } from "@/components/icons/whatsapp";

export const CATEGORIES: TicketCategory[] = [
  "Payments",
  "Course registration",
  "Results",
  "Bio data",
  "E-learning",
  "Accommodation",
  "Technical issue",
  "Other",
];

type StatusFilter = "all" | "active" | TicketStatus;

export function SupportView() {
  const q = useAsync(getTickets);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const tickets = useMemo(() => {
    const s = query.trim().toLowerCase();
    return (q.data ?? []).filter(
      (t) =>
        (status === "all" ||
          (status === "active" ? t.status === "open" || t.status === "in_progress" : t.status === status)) &&
        (category === "all" || t.category === category) &&
        (!s || t.subject.toLowerCase().includes(s) || t.id.toLowerCase().includes(s)),
    );
  }, [q.data, status, category, query]);

  const n = (f: StatusFilter) =>
    (q.data ?? []).filter((t) => f === "all" || (f === "active" ? t.status === "open" || t.status === "in_progress" : t.status === f)).length;

  return (
    <>
      <PageHeader
        title="Support"
        description="Raise a ticket with the bursary, academic office or ICT, and follow the conversation here."
        actions={
          <>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="pressable inline-flex h-10 items-center gap-2 rounded-[10px] border border-border bg-surface px-3.5 text-sm font-medium text-ink shadow-card hover:bg-surface-2"
            >
              <WhatsAppIcon className="size-4 text-[#1f9d55]" /> WhatsApp
            </a>
            <ButtonLink href="/support/new" variant="primary" size="sm" className="h-10" icon={<MessageSquarePlus className="size-4" />}>
              New ticket
            </ButtonLink>
          </>
        }
      />

      <div className="mb-4 space-y-3">
        <Tabs<StatusFilter>
          label="Ticket status"
          value={status}
          onChange={setStatus}
          items={[
            { value: "all", label: "All", count: q.data ? n("all") : undefined },
            { value: "active", label: "Active", count: q.data ? n("active") : undefined },
            { value: "resolved", label: "Resolved", count: q.data ? n("resolved") : undefined },
            { value: "closed", label: "Closed", count: q.data ? n("closed") : undefined },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_220px]">
          <Input
            aria-label="Search tickets"
            type="search"
            enterKeyHint="search"
            placeholder="Search subject or ticket ID"
            leading={<Search className="size-4" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            aria-label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: "all", label: "All categories" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
        </div>
      </div>

      {q.error ? (
        <ErrorState onRetry={q.reload} />
      ) : !q.data ? (
        <Card className="divide-y divide-border">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3.5 w-1/3" />
            </div>
          ))}
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox />}
            title={q.data.length ? "No tickets match these filters" : "No tickets yet"}
            description={q.data.length ? "Try another status or category." : "When something isn't working, open a ticket and the right office will reply here."}
            action={
              <ButtonLink href="/support/new" size="sm">
                New ticket
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {tickets.map((t) => {
              const last = t.messages[t.messages.length - 1]!;
              const awaiting = last.author === "staff" && (t.status === "open" || t.status === "in_progress");
              return (
                <li key={t.id}>
                  <Link href={`/support/${t.id}`} className="pressable flex items-center gap-3 p-4 hover:bg-surface-2/60 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <TicketStatusBadge status={t.status} />
                        <Badge>{t.category}</Badge>
                        {awaiting && <Badge tone="gold">New reply</Badge>}
                      </div>
                      <p className="mt-1.5 font-semibold text-ink">{t.subject}</p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                        <span className="font-medium">{last.author === "staff" ? last.name.split(" · ")[0] : "You"}:</span> {last.body}
                      </p>
                      <p className="mt-1 text-xs text-subtle" suppressHydrationWarning>
                        {t.id} · Updated {relativeTime(t.updatedAt)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-subtle" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
