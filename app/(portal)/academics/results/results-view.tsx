"use client";

import { useState } from "react";
import { Award, BookOpen, ChevronDown, GraduationCap, TrendingUp } from "lucide-react";
import { getResults } from "@/lib/api";
import { useAsync } from "@/lib/use-async";
import { formatDate } from "@/lib/format";
import { GRADE_SCALE } from "@/lib/grading";
import { cn } from "@/lib/cn";
import type { ResultsSummary, SemesterResult } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { PageHeader, Progress } from "@/components/ui/misc";
import { EmptyState, ErrorState, SkeletonCard } from "@/components/ui/states";

const gradeTone: Record<string, string> = {
  A: "bg-success-soft text-success",
  B: "bg-info-soft text-info",
  C: "bg-gold-soft text-gold-strong",
  D: "bg-warning-soft text-warning",
  E: "bg-warning-soft text-warning",
  F: "bg-danger-soft text-danger",
};

export function ResultsView() {
  const q = useAsync(getResults);
  const [session, setSession] = useState("all");

  if (q.error) return <ErrorState onRetry={q.reload} />;

  return (
    <>
      <PageHeader title="Results" description="Your grades for every published semester, with GPA and cumulative CGPA." />
      {!q.data ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} className="hidden sm:block" />
          </div>
          <SkeletonCard lines={8} />
        </div>
      ) : q.data.semesters.length === 0 ? (
        <Card>
          <EmptyState icon={<GraduationCap />} title="No results published yet" description="Results appear here once the Senate approves them for your semester." />
        </Card>
      ) : (
        <Body data={q.data} session={session} setSession={setSession} />
      )}
    </>
  );
}

function Body({
  data,
  session,
  setSession,
}: {
  data: ResultsSummary;
  session: string;
  setSession: (s: string) => void;
}) {
  const sessions = [...new Set(data.semesters.map((s) => s.session))];
  const shown = data.semesters.filter((s) => session === "all" || s.session === session);
  const latest = data.semesters[0]!;
  const prev = data.semesters[1];
  const delta = prev ? latest.gpa - prev.gpa : 0;

  return (
    <div className="space-y-5">
      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 rounded-2xl border border-border bg-surface p-4 shadow-card sm:col-span-1 sm:p-5">
          <div className="flex items-center justify-between text-sm font-medium text-muted">
            CGPA <GraduationCap className="size-4 text-subtle" aria-hidden />
          </div>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[28px] font-semibold leading-none tracking-tight text-ink tabular">{data.cgpa.toFixed(2)}</span>
            <span className="text-sm text-subtle">/ 5.00</span>
          </p>
          <Progress value={data.cgpa} max={5} label="CGPA out of 5" className="mt-3" />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between text-sm font-medium text-muted">
            Class <Award className="size-4 text-subtle" aria-hidden />
          </div>
          <p className="mt-2 text-[17px] font-semibold leading-tight tracking-tight text-ink sm:text-xl">{data.classOfDegree}</p>
          <p className="mt-1 text-sm text-muted">{data.totalUnits} units earned</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between text-sm font-medium text-muted">
            Last GPA <TrendingUp className="size-4 text-subtle" aria-hidden />
          </div>
          <p className="mt-2 text-[17px] font-semibold leading-tight tracking-tight text-ink tabular sm:text-xl">{latest.gpa.toFixed(2)}</p>
          {prev && (
            <p className={cn("mt-1 text-sm tabular", delta >= 0 ? "text-success" : "text-danger")}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)} vs previous
            </p>
          )}
        </div>
      </section>

      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">Semester results</h2>
        <Select
          aria-label="Filter by session"
          className="w-44"
          value={session}
          onChange={(e) => setSession(e.target.value)}
          options={[{ value: "all", label: "All sessions" }, ...sessions.map((s) => ({ value: s, label: s }))]}
        />
      </div>

      <div className="space-y-3">
        {shown.map((s, i) => (
          <SemesterCard key={`${s.session}-${s.semester}`} s={s} defaultOpen={i === 0} />
        ))}
      </div>

      <Card>
        <CardHeader title="Grading scale" description="NUC 5-point scale" icon={<BookOpen className="size-4" />} />
        <CardBody>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {GRADE_SCALE.map((g) => (
              <li key={g.grade} className="rounded-xl border border-border p-2.5 text-center">
                <span className={cn("inline-grid size-7 place-items-center rounded-md text-sm font-bold", gradeTone[g.grade])}>{g.grade}</span>
                <p className="mt-1 text-xs text-muted tabular">{g.range}</p>
                <p className="text-xs font-medium text-ink">{g.point} pts</p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function SemesterCard({ s, defaultOpen }: { s: SemesterResult; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `sem-${s.session}-${s.semester}`.replace(/\W/g, "");
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="pressable flex w-full items-center gap-3 p-4 text-left sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">
            {s.session} · {s.semester} Semester
          </p>
          <p className="text-sm text-muted">
            {s.level} Level · {s.courses.length} courses · {s.totalUnits} units · Published {formatDate(s.publishedAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">GPA</p>
          <p className="text-xl font-semibold text-ink tabular">{s.gpa.toFixed(2)}</p>
        </div>
        <ChevronDown className={cn("size-5 shrink-0 text-subtle transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div id={id} className="border-t border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide text-subtle">
                <th className="px-4 py-2.5 font-semibold sm:px-5">Course</th>
                <th className="px-2 py-2.5 text-center font-semibold">Units</th>
                <th className="hidden px-2 py-2.5 text-center font-semibold sm:table-cell">Score</th>
                <th className="px-4 py-2.5 text-right font-semibold sm:px-5">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.courses.map((c) => (
                <tr key={c.code}>
                  <td className="px-4 py-2.5 sm:px-5">
                    <p className="font-semibold text-ink">{c.code}</p>
                    <p className="text-muted">{c.title}</p>
                  </td>
                  <td className="px-2 py-2.5 text-center text-ink tabular">{c.units}</td>
                  <td className="hidden px-2 py-2.5 text-center text-ink tabular sm:table-cell">{c.score}</td>
                  <td className="px-4 py-2.5 text-right sm:px-5">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xs text-muted tabular sm:hidden">{c.score}</span>
                      <span className={cn("inline-grid size-7 place-items-center rounded-md text-sm font-bold", gradeTone[c.grade])}>{c.grade}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
