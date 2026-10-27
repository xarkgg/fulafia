"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, FileLock2, FileText, GraduationCap, ReceiptText, ScrollText } from "lucide-react";
import { getDocuments } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { documentHref } from "@/lib/print";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { PortalDocument } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";

type Group = "all" | PortalDocument["group"];

const ICON: Record<PortalDocument["group"], typeof FileText> = {
  Admission: ScrollText,
  Academic: GraduationCap,
  Payments: ReceiptText,
};

export function DocumentsView() {
  const q = useAsync(getDocuments);
  const [group, setGroup] = useState<Group>("all");

  const docs = useMemo(() => (q.data ?? []).filter((d) => group === "all" || d.group === group), [q.data, group]);
  const count = (g: Group) => (q.data ?? []).filter((d) => g === "all" || d.group === g).length;

  return (
    <>
      <PageHeader
        title="Documents"
        description="Admission letters, course forms, bio data and fee receipts. Open any document to print or save it as a PDF."
      />
      <Tabs<Group>
        label="Document type"
        className="mb-4"
        value={group}
        onChange={setGroup}
        items={[
          { value: "all", label: "All", count: q.data ? count("all") : undefined },
          { value: "Admission", label: "Admission", count: q.data ? count("Admission") : undefined },
          { value: "Academic", label: "Academic", count: q.data ? count("Academic") : undefined },
          { value: "Payments", label: "Receipts", count: q.data ? count("Payments") : undefined },
        ]}
      />

      {q.error ? (
        <ErrorState onRetry={q.reload} />
      ) : !q.data ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <Card>
          <EmptyState icon={<FileText />} title="No documents here yet" description="Documents appear as soon as they are issued, for example after you pay a fee or submit course registration." />
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <DocumentCard doc={doc} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function DocumentCard({ doc }: { doc: PortalDocument }) {
  const Icon = doc.status === "locked" ? FileLock2 : ICON[doc.group];
  const href = documentHref(doc);
  const locked = doc.status === "locked";

  return (
    <Card className={cn("flex h-full flex-col p-4", locked && "bg-surface-2/60")}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            locked ? "bg-surface-3 text-subtle" : "bg-gold-soft text-gold-strong",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="font-semibold text-ink">{doc.title}</h2>
          </div>
          <p className="mt-0.5 text-sm text-muted">{doc.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
            <Badge tone={locked ? "neutral" : "gold"}>{doc.group}</Badge>
            {doc.session && <span>{doc.session}</span>}
            {doc.issuedAt && <span>Issued {formatDate(doc.issuedAt)}</span>}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        {locked ? (
          <p className="flex-1 text-sm text-muted">
            {doc.lockedReason}{" "}
            {doc.kind === "course-form" && (
              <Link href="/academics/registration" className="font-medium text-gold-strong hover:underline">
                Register courses
              </Link>
            )}
          </p>
        ) : (
          <>
            <Link
              href={href}
              className="pressable inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[10px] border border-border bg-surface text-sm font-medium text-ink hover:bg-surface-2 sm:flex-none sm:px-3"
            >
              <Eye className="size-4" aria-hidden /> View
            </Link>
            <a
              href={`${href}&autoprint=1`}
              target="_blank"
              rel="noreferrer"
              className="pressable inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#0b1f3a] text-sm font-medium text-white hover:bg-[#142c4f] dark:bg-gold dark:text-[#0b1424] sm:flex-none sm:px-3"
            >
              <Download className="size-4" aria-hidden /> Download PDF
            </a>
          </>
        )}
      </div>
    </Card>
  );
}
