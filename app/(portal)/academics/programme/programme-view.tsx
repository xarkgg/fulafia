"use client";

import { useState, type FormEvent } from "react";
import { ArrowRightLeft, CalendarDays, CircleCheck, Info, ReceiptText, Route } from "lucide-react";
import { applyForTransfer, getProgramme } from "@/lib/api";
import { errorMessage, useAsync } from "@/lib/use-async";
import { formatNaira } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReadField, Select, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { ErrorState, Notice, SkeletonCard } from "@/components/ui/states";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";

const PROGRAMMES = [
  "B.Sc. Software Engineering",
  "B.Sc. Cyber Security",
  "B.Sc. Information Technology",
  "B.Sc. Mathematics",
  "B.Sc. Statistics",
  "B.Sc. Physics",
];

export function ProgrammeView() {
  const q = useAsync(getProgramme);
  const [applyOpen, setApplyOpen] = useState(false);

  if (q.error) return <ErrorState onRetry={q.reload} />;

  return (
    <>
      <PageHeader title="Choice of programme" description="Your current programme, and how to apply for a transfer." />
      {!q.data ? (
        <div className="space-y-4">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={6} />
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader title="Current programme" icon={<Route className="size-4" />} />
            <CardBody>
              <p className="text-xl font-semibold tracking-tight text-ink">{q.data.programme}</p>
              <p className="text-sm text-muted">{q.data.degree}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                <ReadField label="Faculty" value={q.data.faculty} />
                <ReadField label="Department" value={q.data.department} />
                <ReadField label="Level" value={`${q.data.level} Level`} />
                <ReadField label="Duration" value={`${q.data.duration} years`} />
                <ReadField label="Admitted" value={q.data.admittedSession} />
                <ReadField label="Entry mode" value={q.data.entryMode} />
                <ReadField label="Study mode" value={q.data.studyMode} />
                <ReadField label="Expected graduation" value={q.data.expectedGraduation} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Programme transfer"
              icon={<ArrowRightLeft className="size-4" />}
              action={q.data.transfer.open ? <Badge tone="success" dot>Open</Badge> : <Badge>Closed</Badge>}
            />
            <CardBody className="space-y-5">
              <p className="flex items-center gap-2 text-sm text-muted">
                <CalendarDays className="size-4" aria-hidden /> Application window: <strong className="text-ink">{q.data.transfer.window}</strong>
              </p>
              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink">Requirements</h3>
                <ul className="space-y-2">
                  {q.data.transfer.requirements.map((r) => (
                    <li key={r} className="flex gap-2.5 text-sm text-ink/85">
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-2 text-sm font-semibold text-ink">Notes</h3>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
                  {q.data.transfer.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </section>
              <Notice tone="gold" icon={<ReceiptText />} title={`Transfer fee: ${formatNaira(q.data.transfer.fee)}`}>
                {q.data.transfer.feeNotice}
              </Notice>
              <div className="flex flex-col gap-2 sm:flex-row">
                <ButtonLink href="/fees" variant="secondary">
                  Pay transfer fee
                </ButtonLink>
                <Button onClick={() => setApplyOpen(true)} disabled={!q.data.transfer.open}>
                  Apply for transfer
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
      <ApplySheet open={applyOpen} onClose={() => setApplyOpen(false)} />
    </>
  );
}

function ApplySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [programme, setProgramme] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [ref, setRef] = useState<string>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      const r = await applyForTransfer({ programme, reason });
      setRef(r.reference);
      toast.success("Application submitted", `Reference ${r.reference}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function close() {
    onClose();
    window.setTimeout(() => {
      setRef(undefined);
      setError(undefined);
    }, 200);
  }

  return (
    <Sheet open={open} onClose={close} title={ref ? "Application submitted" : "Apply for programme transfer"}>
      {ref ? (
        <div className="space-y-4 pt-1">
          <Notice tone="success" icon={<CircleCheck />} title={`Reference ${ref}`}>
            Both departments will review your application. You&apos;ll get an update by email and in Support.
          </Notice>
          <Button className="w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 pt-1" noValidate>
          <Select
            label="Proposed programme"
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            placeholder="Select a programme"
            options={PROGRAMMES.map((p) => ({ value: p, label: p }))}
          />
          <Textarea
            label="Reason for transfer"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly explain why you want to change programme"
            hint={`${reason.trim().length}/20 min`}
          />
          {error && (
            <Notice tone="danger" icon={<Info />}>
              {error}
            </Notice>
          )}
          <Button type="submit" className="w-full" loading={loading}>
            Submit application
          </Button>
        </form>
      )}
    </Sheet>
  );
}
