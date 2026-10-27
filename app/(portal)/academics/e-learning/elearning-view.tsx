"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, Copy, ExternalLink, MonitorPlay, TriangleAlert } from "lucide-react";
import { getElearning, registerElearning } from "@/lib/api";
import { errorMessage, useAsync } from "@/lib/use-async";
import { formatNaira } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { EmptyState, ErrorState, Notice, SkeletonCard } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

export function ElearningView() {
  const toast = useToast();
  const q = useAsync(getElearning);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function activate() {
    setError(undefined);
    setLoading(true);
    try {
      const d = await registerElearning();
      q.setData(d);
      toast.success("E-learning activated", "Your LMS account is ready.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  if (q.error) return <ErrorState onRetry={q.reload} />;

  return (
    <>
      <PageHeader title="E-learning" description="Register for the university LMS to get lecture materials, assignments and online CBT." />
      {!q.data ? (
        <SkeletonCard lines={6} />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader
              title={q.data.platform}
              description={`${q.data.session} · ${q.data.semester} Semester`}
              icon={<MonitorPlay className="size-4" />}
              action={q.data.registered ? <Badge tone="success" dot>Active</Badge> : <Badge tone="warning" dot>Not registered</Badge>}
            />
            <CardBody className="space-y-5">
              {q.data.registered ? (
                <>
                  <div className="rounded-xl border border-border bg-surface-2/60 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-subtle">LMS username</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="font-mono text-[15px] font-semibold text-ink">{q.data.username}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Copy className="size-4" />}
                        onClick={() => {
                          void navigator.clipboard?.writeText(q.data!.username ?? "");
                          toast.info("Username copied");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-muted">Use your portal password the first time you sign in.</p>
                  </div>
                  <a
                    href={q.data.platformUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="pressable inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#0b1f3a] px-4 text-[15px] font-medium text-white dark:bg-gold dark:text-[#0b1424]"
                  >
                    Open the LMS <ExternalLink className="size-4" />
                  </a>
                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-ink">Enrolled courses</h3>
                    {q.data.courses.length ? (
                      <ul className="divide-y divide-border rounded-xl border border-border">
                        {q.data.courses.map((c) => (
                          <li key={c.code} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                            <span className="text-ink">
                              <strong>{c.code}</strong> · {c.title}
                            </span>
                            <CircleCheck className="size-4 shrink-0 text-success" aria-label="Enrolled" />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState
                        className="rounded-xl border border-dashed border-border py-6"
                        title="No courses yet"
                        description="Courses are added to the LMS once you register them."
                        action={
                          <Link href="/academics/registration" className="text-sm font-medium text-gold-strong">
                            Register courses
                          </Link>
                        }
                      />
                    )}
                  </section>
                </>
              ) : (
                <>
                  <ul className="space-y-2.5">
                    {q.data.benefits.map((b) => (
                      <li key={b} className="flex gap-2.5 text-[15px] text-ink/85">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {!q.data.feePaid && (
                    <Notice tone="warning" icon={<TriangleAlert />} title="Pay your school fee first">
                      The {q.data.feeName} charge ({formatNaira(q.data.feeAmount)}) is part of your school fee.{" "}
                      <Link href="/fees" className="font-semibold text-gold-strong hover:underline">
                        Pay school fee
                      </Link>
                    </Notice>
                  )}
                  {error && (
                    <Notice tone="danger" title="Couldn't activate">
                      {error}
                    </Notice>
                  )}
                  <Button onClick={activate} loading={loading} disabled={!q.data.feePaid} className="w-full sm:w-auto">
                    Activate e-learning
                  </Button>
                </>
              )}
            </CardBody>
          </Card>

          <Card className="h-fit">
            <CardHeader title="How it works" />
            <CardBody>
              <ol className="space-y-3 text-sm text-muted">
                {["Pay your school fee (it includes the E-Learning Service charge).", "Activate e-learning here to create your LMS account.", "Register your courses; they're added to the LMS automatically.", "Sign in to the LMS with your username and portal password."].map((t, i) => (
                  <li key={t} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-semibold text-gold-strong">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
