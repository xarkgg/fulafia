"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CircleCheck,
  FileDown,
  GraduationCap,
  LifeBuoy,
  ReceiptText,
  TriangleAlert,
  Wallet as WalletIcon,
} from "lucide-react";
import { getDashboard } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatNaira, greeting } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";
import { EmptyState, ErrorState, Skeleton, SkeletonCard } from "@/components/ui/states";
import { FeeStatusBadge, RegistrationStatusBadge } from "@/components/status";
import { TxnRow } from "@/components/wallet/txn-row";

const QUICK_ACTIONS = [
  { href: "/academics/registration", label: "Register courses", icon: BookOpenCheck },
  { href: "/fees", label: "Pay fees", icon: ReceiptText },
  { href: "/academics/results", label: "Check results", icon: GraduationCap },
  { href: "/documents", label: "Download documents", icon: FileDown },
];

export function DashboardView() {
  const q = useAsync(getDashboard);
  const [hello, setHello] = useState("Welcome");
  useEffect(() => setHello(greeting()), []);

  if (q.error) return <ErrorState onRetry={q.reload} />;
  if (!q.data) return <DashboardSkeleton />;

  const d = q.data;
  const { student, term, registration, payment, wallet } = d;
  const owing = payment.status === "unpaid";
  const regDone = registration.status === "submitted" || registration.status === "approved";

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Greeting */}
      <section className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink sm:text-[26px]">
          {hello}, {student.firstName}
        </h1>
        <p className="text-[15px] text-muted">
          {student.level} Level · {student.programme} · {term.session} {term.semester} Semester
        </p>
      </section>

      {/* What needs doing */}
      {owing ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-warning/25 bg-warning-soft p-4 sm:flex-row sm:items-center">
          <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden />
          <p className="flex-1 text-[15px] text-ink">
            <strong className="font-semibold">Your {term.session} {term.semester} Semester school fee is outstanding.</strong>{" "}
            <span className="text-muted">Pay {formatNaira(payment.outstanding)} to unlock course registration.</span>
          </p>
          <ButtonLink href="/fees" variant="primary" size="sm" className="self-start sm:self-auto">
            Pay now <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      ) : !regDone ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-info/20 bg-info-soft p-4 sm:flex-row sm:items-center">
          <BookOpenCheck className="size-5 shrink-0 text-info" aria-hidden />
          <p className="flex-1 text-[15px] text-ink">
            <strong className="font-semibold">Fees paid. Next, submit your course registration.</strong>{" "}
            <span className="text-muted">Your adviser approves it after you submit.</span>
          </p>
          <ButtonLink href="/academics/registration" variant="primary" size="sm" className="self-start sm:self-auto">
            Register courses <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      ) : null}

      {/* Key numbers */}
      <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Link href="/academics/results" className="pressable col-span-2 rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-border-strong sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">CGPA</p>
            <GraduationCap className="size-4 text-subtle" aria-hidden />
          </div>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[28px] font-semibold leading-none tracking-tight text-ink tabular">{d.cgpa.toFixed(2)}</span>
            <span className="text-sm text-subtle">/ 5.00</span>
          </p>
          <Progress value={d.cgpa} max={5} label="CGPA out of 5" className="mt-3" />
          <p className="mt-2 text-sm text-muted">
            {d.classOfDegree} · {d.totalUnitsEarned} units earned
          </p>
        </Link>

        <Link href="/academics/registration" className="pressable rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-border-strong sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Courses</p>
            <BookOpenCheck className="size-4 text-subtle" aria-hidden />
          </div>
          <p className="mt-2 text-[22px] font-semibold leading-tight tracking-tight text-ink tabular sm:text-2xl">
            {registration.courses}
          </p>
          <p className="mt-1 text-sm text-muted tabular">
            {registration.units} / {registration.maxUnits} units
          </p>
        </Link>

        <Link href="/fees" className="pressable rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-border-strong sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">School fee</p>
            <ReceiptText className="size-4 text-subtle" aria-hidden />
          </div>
          <p className={cn("mt-2 text-[17px] font-semibold leading-tight tracking-tight tabular sm:text-2xl", owing ? "text-warning" : "text-success")}>
            {owing ? formatNaira(payment.outstanding) : "Paid"}
          </p>
          <p className="mt-1 text-sm text-muted">{owing ? "Outstanding" : formatNaira(payment.paid)}</p>
        </Link>

        <Link href="/wallet" className="pressable col-span-2 rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-border-strong sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted">Wallet balance</p>
            <WalletIcon className="size-4 text-subtle" aria-hidden />
          </div>
          <p className="mt-2 text-[22px] font-semibold leading-tight tracking-tight text-ink tabular sm:text-2xl">
            {formatNaira(wallet.balance)}
          </p>
          <p className="mt-1 text-sm text-muted">Available to pay fees</p>
        </Link>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
        <div className="space-y-5 lg:space-y-6">
          {/* Quick actions */}
          <section aria-labelledby="qa">
            <h2 id="qa" className="mb-3 text-[15px] font-semibold text-ink">
              Quick actions
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="pressable group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-gold/50"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-gold-soft text-gold-strong">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="flex items-center justify-between gap-1 text-sm font-semibold text-ink">
                    {label}
                    <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Wallet activity */}
          <Card>
            <CardHeader
              title="Recent wallet activity"
              description="Funding and fee payments from your wallet"
              action={
                <Link href="/wallet" className="pressable rounded-md text-sm font-medium text-gold-strong hover:underline">
                  View all
                </Link>
              }
            />
            <CardBody className="pt-1 sm:pt-1">
              {wallet.recent.length === 0 ? (
                <EmptyState icon={<WalletIcon />} title="No wallet activity yet" description="Funding and payments will appear here." />
              ) : (
                <div className="divide-y divide-border">
                  {wallet.recent.map((t) => (
                    <TxnRow key={t.id} t={t} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5 lg:space-y-6">
          {/* Current term */}
          <Card>
            <CardHeader title="Current term" icon={<CalendarDays className="size-4" />} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-subtle">Session</dt>
                  <dd className="mt-1 font-semibold text-ink">{term.session}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-subtle">Semester</dt>
                  <dd className="mt-1 font-semibold text-ink">{term.semester}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-subtle">Level</dt>
                  <dd className="mt-1 font-semibold text-ink">{student.level}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-subtle">Status</dt>
                  <dd className="mt-1 font-semibold text-ink">{student.status}</dd>
                </div>
              </dl>
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">Course registration</span>
                  <RegistrationStatusBadge status={registration.status} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">School fee</span>
                  <FeeStatusBadge status={payment.status} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Support */}
          <Card>
            <CardBody className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy">
                <LifeBuoy className="size-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">Need help?</p>
                <p className="mt-0.5 text-sm text-muted">
                  {d.openTickets > 0 ? (
                    <>
                      You have <strong className="text-ink">{d.openTickets}</strong> open support{" "}
                      {d.openTickets === 1 ? "ticket" : "tickets"}.
                    </>
                  ) : (
                    <>
                      <CircleCheck className="mr-1 inline size-3.5 text-success" />
                      No open tickets.
                    </>
                  )}
                </p>
                <Link href="/support" className="pressable mt-2 inline-flex rounded-md text-sm font-medium text-gold-strong hover:underline">
                  Go to support
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} lines={2} className={cn(i === 0 && "col-span-2 lg:col-span-1", i === 3 && "col-span-2 lg:col-span-1")} />
        ))}
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={4} />
      </div>
    </div>
  );
}
