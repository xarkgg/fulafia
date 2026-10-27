"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, Check, CircleCheck, Lock, Minus, Plus, Printer, ReceiptText, TriangleAlert } from "lucide-react";
import { getCourseRegistration, getTerm, saveCourseRegistration } from "@/lib/api";
import { errorMessage, useAsync } from "@/lib/use-async";
import { formatDateTime } from "@/lib/format";
import { printHref } from "@/lib/print";
import { cn } from "@/lib/cn";
import type { Course, CourseRegistration, CourseType, Semester } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { EmptyState, ErrorState, Notice, Skeleton, SkeletonCard } from "@/components/ui/states";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { RegistrationStatusBadge } from "@/components/status";

const GROUPS: { type: CourseType; label: string; hint: string }[] = [
  { type: "core", label: "Core courses", hint: "Required for your programme" },
  { type: "elective", label: "Electives", hint: "Choose to make up your units" },
  { type: "gst", label: "General studies", hint: "University-wide requirements" },
];

export function RegistrationView() {
  const term = useAsync(getTerm);
  const [session, setSession] = useState<string>();
  const [semester, setSemester] = useState<Semester>();
  useEffect(() => {
    if (term.data && !session) {
      setSession(term.data.current.session);
      setSemester(term.data.current.semester);
    }
  }, [term.data, session]);

  const cur = term.data?.current;
  const isCurrent = !!cur && session === cur.session && semester === cur.semester;
  const isFuture = !!cur && !!session && (session > cur.session || (session === cur.session && semester === "Second" && cur.semester === "First"));
  const reg = useAsync(
    () => (session && semester ? getCourseRegistration(session, semester) : new Promise<CourseRegistration>(() => {})),
    [session, semester],
  );

  return (
    <>
      <PageHeader title="Course registration" description="Add and drop courses, then submit for your level adviser's approval." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:flex sm:items-end">
        {term.data ? (
          <>
            <Select
              label="Session"
              className="sm:w-48"
              value={session ?? ""}
              onChange={(e) => setSession(e.target.value)}
              options={term.data.sessions.map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="Semester"
              className="sm:w-44"
              value={semester ?? ""}
              onChange={(e) => setSemester(e.target.value as Semester)}
              options={[
                { value: "First", label: "First" },
                { value: "Second", label: "Second" },
              ]}
            />
          </>
        ) : (
          <>
            <Skeleton className="h-[70px]" />
            <Skeleton className="h-[70px]" />
          </>
        )}
      </div>

      {term.error || reg.error ? (
        <ErrorState onRetry={() => (term.error ? term.reload() : reg.reload())} />
      ) : !reg.data || reg.loading ? (
        <div className="space-y-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={7} />
        </div>
      ) : !isCurrent ? (
        <Card>
          <EmptyState
            icon={<Lock />}
            title={isFuture ? `${session} ${semester} Semester hasn't opened` : `Registration for ${session} ${semester} Semester is closed`}
            description={
              isFuture
                ? "This semester hasn't opened yet. Registration opens at the start of the semester."
                : "You can still print the course form you registered for that semester."
            }
            action={
              !isFuture ? (
                <ButtonLink href={printHref.courseForm(session!, semester!)} icon={<Printer className="size-4" />}>
                  Print course form
                </ButtonLink>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Editor key={`${session}-${semester}`} reg={reg.data} onSaved={(r) => reg.setData(r)} />
      )}
    </>
  );
}

function Editor({ reg, onSaved }: { reg: CourseRegistration; onSaved: (r: CourseRegistration) => void }) {
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>(reg.registered);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string>();

  const locked = reg.status === "submitted" || reg.status === "approved";
  const byCode = useMemo(() => new Map(reg.available.map((c) => [c.code, c])), [reg.available]);
  const units = selected.reduce((s, code) => s + (byCode.get(code)?.units ?? 0), 0);
  const dirty = selected.slice().sort().join() !== reg.registered.slice().sort().join();
  const pct = Math.min(100, (units / reg.maxUnits) * 100);
  const minPct = (reg.minUnits / reg.maxUnits) * 100;
  const under = units < reg.minUnits;

  function toggle(c: Course) {
    if (locked) return;
    if (selected.includes(c.code)) {
      setSelected((s) => s.filter((x) => x !== c.code));
      return;
    }
    if (units + c.units > reg.maxUnits) {
      toast.error("Unit limit reached", `Adding ${c.code} would take you to ${units + c.units} units. The maximum is ${reg.maxUnits}.`);
      return;
    }
    setSelected((s) => [...s, c.code]);
  }

  async function save(submit: boolean) {
    setError(undefined);
    setSaving(submit ? "submit" : "draft");
    try {
      const r = await saveCourseRegistration(reg.session, reg.semester, selected, submit);
      onSaved(r);
      setConfirm(false);
      toast.success(submit ? "Registration submitted" : "Draft saved", submit ? "Your level adviser will review it. Your course form is ready." : `${selected.length} courses · ${units} units`);
    } catch (e) {
      setError(errorMessage(e));
      setConfirm(false);
      toast.error(submit ? "Couldn't submit" : "Couldn't save", errorMessage(e));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      {/* Status */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Status</span>
              <RegistrationStatusBadge status={reg.status} />
            </div>
            {locked && (
              <ButtonLink href={printHref.courseForm(reg.session, reg.semester)} size="sm" icon={<Printer className="size-4" />}>
                Print course form
              </ButtonLink>
            )}
          </div>
          <div>
            <div className="mb-2 flex items-baseline justify-between text-sm">
              <span className="font-medium text-ink">
                <span className="text-lg font-semibold tabular">{units}</span>
                <span className="text-muted"> / {reg.maxUnits} units</span>
              </span>
              <span className={cn("text-xs", under ? "text-warning" : "text-success")}>
                {under ? `${reg.minUnits - units} more to reach the minimum of ${reg.minUnits}` : "Within the allowed range"}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-surface-3" role="meter" aria-label="Registered units" aria-valuemin={0} aria-valuemax={reg.maxUnits} aria-valuenow={units}>
              <div className={cn("h-full rounded-full transition-[width] duration-300", under ? "bg-warning" : "bg-gold")} style={{ width: `${pct}%` }} />
              <span className="absolute -top-1 h-[18px] w-0.5 rounded bg-border-strong" style={{ left: `${minPct}%` }} aria-hidden />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-subtle tabular">
              <span>0</span>
              <span style={{ marginLeft: `${minPct - 6}%` }}>min {reg.minUnits}</span>
              <span>max {reg.maxUnits}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {locked && (
        <Notice tone="success" icon={<CircleCheck />} title="Submitted for approval">
          Submitted {reg.submittedAt ? formatDateTime(reg.submittedAt) : ""}. To change courses after submission, contact your level adviser.
        </Notice>
      )}
      {!locked && !reg.feesPaid && (
        <Notice tone="warning" icon={<TriangleAlert />} title="School fee not yet paid">
          You can plan your courses and save a draft now. Submitting needs your {reg.session} {reg.semester} Semester school fee.{" "}
          <Link href="/fees" className="font-semibold text-gold-strong underline-offset-2 hover:underline">
            Pay school fee
          </Link>
        </Notice>
      )}
      {error && (
        <Notice tone="danger" title="Something needs attention">
          {error}
        </Notice>
      )}

      {/* Courses */}
      {GROUPS.map((g) => {
        const list = reg.available.filter((c) => c.type === g.type);
        if (!list.length) return null;
        return (
          <Card key={g.type}>
            <div className="flex items-baseline justify-between gap-3 px-4 pt-4 sm:px-5">
              <h2 className="text-[15px] font-semibold text-ink">{g.label}</h2>
              <p className="text-xs text-subtle">{g.hint}</p>
            </div>
            <ul className="mt-2 divide-y divide-border">
              {list.map((c) => {
                const on = selected.includes(c.code);
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => toggle(c)}
                      disabled={locked}
                      aria-pressed={on}
                      className={cn(
                        "pressable flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5",
                        !locked && "hover:bg-surface-2/60",
                        locked && !on && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors",
                          on ? "border-gold bg-gold text-white dark:text-[#0b1424]" : "border-border-strong",
                        )}
                        aria-hidden
                      >
                        {on && <Check className="size-4" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-medium text-ink">
                          <span className="font-semibold">{c.code}</span> · {c.title}
                        </span>
                        {c.lecturer && <span className="block truncate text-sm text-muted">{c.lecturer}</span>}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold text-ink tabular">{c.units} units</span>
                        {!locked && (
                          <span className={cn("mt-0.5 flex items-center justify-end gap-0.5 text-xs font-medium", on ? "text-danger" : "text-gold-strong")}>
                            {on ? <Minus className="size-3" /> : <Plus className="size-3" />}
                            {on ? "Drop" : "Add"}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      {/* Action bar: sticky above the mobile tab bar */}
      {!locked && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:sticky lg:bottom-4 lg:rounded-2xl lg:border lg:shadow-pop">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink tabular">
                {selected.length} courses · {units} units
              </p>
              <p className="truncate text-xs text-muted">{dirty ? "Unsaved changes" : reg.status === "draft" ? "Draft saved" : "Not started"}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => save(false)} loading={saving === "draft"} disabled={!dirty || !!saving}>
              Save draft
            </Button>
            <Button size="sm" onClick={() => setConfirm(true)} disabled={!!saving || selected.length === 0} icon={<BookOpenCheck className="size-4" />}>
              Submit
            </Button>
          </div>
        </div>
      )}

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Submit course registration?"
        description={`${reg.session} ${reg.semester} Semester · ${selected.length} courses · ${units} units`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} disabled={saving === "submit"}>
              Keep editing
            </Button>
            <Button onClick={() => save(true)} loading={saving === "submit"}>
              Submit for approval
            </Button>
          </>
        }
      >
        <ul className="divide-y divide-border rounded-xl border border-border">
          {selected.map((code) => {
            const c = byCode.get(code)!;
            return (
              <li key={code} className="flex justify-between gap-3 px-3.5 py-2.5 text-sm">
                <span className="text-ink">
                  <strong>{c.code}</strong> · {c.title}
                </span>
                <span className="shrink-0 text-muted tabular">{c.units}</span>
              </li>
            );
          })}
        </ul>
        {!reg.feesPaid ? (
          <Notice tone="warning" icon={<ReceiptText />} className="mt-4" title="Pay your school fee first">
            Submission needs your school fee for this semester to be paid. You can save this as a draft and pay now.
          </Notice>
        ) : (
          <p className="mt-4 text-sm text-muted">After submitting you can&apos;t change courses without your adviser. Your course form becomes available to print.</p>
        )}
      </Sheet>
    </div>
  );
}
