"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CircleCheck, CircleDashed, Clock, LifeBuoy, ListChecks, LoaderCircle, SearchX, ShieldCheck } from "lucide-react";
import { getInvoices, getSemesterChecklist, verifyPayment } from "@/lib/api";
import { errorMessage, useAsync } from "@/lib/use-async";
import { formatDate, formatNaira } from "@/lib/format";
import { printHref } from "@/lib/print";
import { cn } from "@/lib/cn";
import type { VerificationResult } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { PageHeader, Progress } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ErrorState, Notice, Skeleton, SkeletonCard } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

type Tab = "verify" | "registration";

export function SelfServiceView() {
  const [tab, setTab] = useState<Tab>("verify");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "registration") setTab("registration");
  }, []);

  return (
    <>
      <PageHeader title="Self service" description="Fix common problems yourself, without queueing at the bursary or ICT." />
      <Tabs<Tab>
        label="Self service"
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: "verify", label: "Payment verification", icon: <ShieldCheck className="size-4" /> },
          { value: "registration", label: "Registration", icon: <ListChecks className="size-4" /> },
        ]}
      />
      {tab === "verify" ? <Verification /> : <Registration />}
    </>
  );
}

const STEPS = ["Contacting Remita", "Matching payment reference", "Updating your records"];

function Verification() {
  const toast = useToast();
  const q = useAsync(() => getInvoices({ status: "pending" }));
  const [selected, setSelected] = useState<string>();
  const [state, setState] = useState<"idle" | "verifying" | "done">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<VerificationResult>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!selected && q.data?.length) setSelected(q.data[0]!.id);
  }, [q.data, selected]);

  useEffect(() => {
    if (state !== "verifying") return;
    setStep(0);
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 600);
    return () => window.clearInterval(t);
  }, [state]);

  async function verify() {
    if (!selected) return;
    setError(undefined);
    setResult(undefined);
    setState("verifying");
    try {
      const r = await verifyPayment(selected);
      setResult(r);
      setState("done");
      if (r.outcome === "success") toast.success("Payment confirmed", r.invoice.title);
    } catch (e) {
      setError(errorMessage(e));
      setState("idle");
    }
  }

  function reset() {
    setState("idle");
    setResult(undefined);
    setSelected(undefined);
    q.reload();
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader
          title="Verify a payment"
          description="Paid at the bank or by transfer but the portal still shows it unpaid? Pick the invoice and we'll check with Remita."
        />
        <CardBody>
          {q.error ? (
            <ErrorState onRetry={q.reload} className="border-0" />
          ) : !q.data ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : state === "done" && result ? (
            <ResultPanel result={result} onAgain={reset} />
          ) : q.data.length === 0 ? (
            <EmptyState
              icon={<BadgeCheck />}
              title="Nothing to verify"
              description="All your invoices are confirmed. Pending bank payments will show up here."
              action={
                <ButtonLink href="/fees" size="sm">
                  Go to fees
                </ButtonLink>
              }
            />
          ) : state === "verifying" ? (
            <div className="py-6" role="status" aria-live="polite">
              <div className="flex items-center gap-3">
                <LoaderCircle className="size-5 animate-spin text-gold" aria-hidden />
                <p className="font-medium text-ink">Verifying payment…</p>
              </div>
              <ol className="mt-4 space-y-2.5 pl-1">
                {STEPS.map((s, i) => (
                  <li key={s} className={cn("flex items-center gap-2.5 text-sm", i <= step ? "text-ink" : "text-subtle")}>
                    {i < step ? (
                      <CircleCheck className="size-4 text-success" aria-hidden />
                    ) : i === step ? (
                      <LoaderCircle className="size-4 animate-spin text-gold" aria-hidden />
                    ) : (
                      <CircleDashed className="size-4" aria-hidden />
                    )}
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void verify();
              }}
            >
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-ink">Select invoice</legend>
                <div className="space-y-2">
                  {q.data.map((inv) => {
                    const on = selected === inv.id;
                    return (
                      <label
                        key={inv.id}
                        className={cn(
                          "pressable flex cursor-pointer items-start gap-3 rounded-xl border p-3.5",
                          on ? "border-gold bg-gold-soft ring-1 ring-gold" : "border-border hover:border-border-strong",
                        )}
                      >
                        <input type="radio" name="invoice" className="sr-only" checked={on} onChange={() => setSelected(inv.id)} />
                        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-gold" : "border-border-strong")} aria-hidden>
                          {on && <span className="size-2.5 rounded-full bg-gold" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                            <span className="font-semibold text-ink">
                              {inv.title} · {inv.session}
                            </span>
                            <span className="font-semibold text-ink tabular">{formatNaira(inv.amount)}</span>
                          </span>
                          <span className="mt-0.5 block text-sm text-muted">
                            RRR <span className="font-mono text-[13px]">{inv.rrr}</span> · {inv.channel} · {formatDate(inv.createdAt)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              {error && (
                <Notice tone="danger" className="mt-4" title="Verification failed">
                  {error}
                </Notice>
              )}
              <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={!selected} icon={<ShieldCheck className="size-4" />}>
                Verify payment
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <Card className="h-fit">
        <CardHeader title="Before you verify" icon={<Clock className="size-4" />} />
        <CardBody>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted">
            <li>Card and wallet payments confirm instantly and never need verification.</li>
            <li>Bank branch payments can take up to 72 hours to settle with Remita.</li>
            <li>Keep your teller or transfer receipt. Support may ask for it.</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function ResultPanel({ result, onAgain }: { result: VerificationResult; onAgain: () => void }) {
  const ok = result.outcome === "success";
  const missing = result.outcome === "not_found";
  const subject = `Payment not confirmed: ${result.invoice.title} (RRR ${result.invoice.rrr})`;
  return (
    <div role="status" className="animate-rise">
      <div className="flex flex-col items-center py-4 text-center">
        <span
          className={cn(
            "grid size-14 place-items-center rounded-full",
            ok ? "bg-success-soft text-success" : missing ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning",
          )}
        >
          {ok ? <CircleCheck className="size-7" /> : missing ? <SearchX className="size-7" /> : <Clock className="size-7" />}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-ink">
          {ok ? "Payment confirmed" : missing ? "Payment not found yet" : "Still processing"}
        </h3>
        <p className="mt-1 max-w-md text-sm text-muted">{result.message}</p>
        <p className="mt-3 rounded-full bg-surface-2 px-3 py-1 text-sm text-muted">
          {result.invoice.title} · <span className="font-mono">{result.invoice.rrr}</span> · {formatNaira(result.invoice.amount)}
        </p>
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onAgain}>
          Verify another
        </Button>
        {ok ? (
          <ButtonLink href={printHref.invoice(result.invoice.id)} variant="primary">
            View receipt
          </ButtonLink>
        ) : (
          <ButtonLink
            href={`/support/new?category=Payments&subject=${encodeURIComponent(subject)}`}
            variant="primary"
            icon={<LifeBuoy className="size-4" />}
          >
            Open a support ticket
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

function Registration() {
  const q = useAsync(getSemesterChecklist);
  if (q.error) return <ErrorState onRetry={q.reload} />;
  if (!q.data) return <SkeletonCard lines={6} />;
  const done = q.data.steps.filter((s) => s.done).length;
  const total = q.data.steps.length;
  return (
    <Card>
      <CardHeader
        title={`Semester registration · ${q.data.session} ${q.data.semester}`}
        description={done === total ? "You're fully registered for this semester." : "Complete each step to be fully registered for this semester."}
      />
      <CardBody>
        <div className="mb-5 flex items-center gap-3">
          <Progress value={done} max={total} label="Registration progress" tone={done === total ? "success" : "gold"} />
          <span className="shrink-0 text-sm font-medium text-muted tabular">
            {done} of {total}
          </span>
        </div>
        <ol className="space-y-2">
          {q.data.steps.map((s, i) => (
            <li
              key={s.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center",
                s.done ? "border-border bg-surface-2/50" : "border-border",
              )}
            >
              <div className="flex flex-1 items-start gap-3">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold",
                    s.done ? "bg-success-soft text-success" : "bg-surface-3 text-muted",
                  )}
                >
                  {s.done ? <CircleCheck className="size-4" aria-label="Done" /> : i + 1}
                </span>
                <div>
                  <p className={cn("font-semibold", s.done ? "text-muted" : "text-ink")}>{s.label}</p>
                  <p className="text-sm text-muted">{s.description}</p>
                </div>
              </div>
              {s.done ? (
                <span className="pl-10 text-sm font-medium text-success sm:pl-0">Complete</span>
              ) : (
                <Link
                  href={s.href}
                  className="pressable ml-10 inline-flex h-9 items-center justify-center rounded-[10px] border border-border bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-2 sm:ml-0"
                >
                  {s.action}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
