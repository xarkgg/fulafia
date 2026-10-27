"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Paperclip, X } from "lucide-react";
import { createTicket } from "@/lib/api";
import { errorMessage } from "@/lib/use-async";
import type { Ticket, TicketCategory } from "@/lib/types";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/misc";
import { Notice } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { CATEGORIES } from "../support-view";

export function NewTicketView() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const initialCategory = params.get("category") as TicketCategory | null;
  const [category, setCategory] = useState<TicketCategory>(initialCategory && CATEGORIES.includes(initialCategory) ? initialCategory : "Payments");
  const [priority, setPriority] = useState<Ticket["priority"]>("normal");
  const [subject, setSubject] = useState(params.get("subject") ?? "");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; body?: string; form?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (subject.trim().length < 5) next.subject = "Add a short subject (at least 5 characters).";
    if (body.trim().length < 15) next.body = "Describe the issue in a little more detail (at least 15 characters).";
    setErrors(next);
    if (next.subject || next.body) return;
    setLoading(true);
    try {
      const t = await createTicket({ subject, category, priority, body, attachment: file?.name });
      toast.success("Ticket created", `${t.id} · we usually reply within one working day.`);
      router.replace(`/support/${t.id}`);
    } catch (err) {
      setErrors({ form: errorMessage(err) });
      setLoading(false);
    }
  }

  return (
    <>
      <Link href="/support" className="pressable mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All tickets
      </Link>
      <PageHeader title="New ticket" description="Tell us what's wrong. Include references like your RRR or course code so we can help faster." />
      <Card className="max-w-2xl">
        <form onSubmit={submit} noValidate>
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Ticket["priority"])}
                options={[
                  { value: "low", label: "Low: a question" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "High: blocking registration or exams" },
                ]}
              />
            </div>
            <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} placeholder="e.g. Hostel payment not reflecting" maxLength={120} />
            <Textarea
              label="Describe the issue"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              error={errors.body}
              rows={6}
              placeholder="What happened, when, and what you've tried."
            />
            <div>
              <Label hint="Optional · JPG, PNG or PDF up to 5 MB">Attachment</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                id="ticket-file"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 5 * 1024 * 1024) {
                    toast.error("File too large", "Attachments must be 5 MB or smaller.");
                    e.target.value = "";
                    return;
                  }
                  setFile(f);
                }}
              />
              {file ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5 text-sm">
                  <Paperclip className="size-4 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="pressable rounded-md p-1 text-subtle hover:text-ink"
                    aria-label="Remove attachment"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="ticket-file"
                  className="pressable flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-sm font-medium text-muted hover:border-gold hover:text-ink"
                >
                  <Paperclip className="size-4" aria-hidden /> Attach a file (e.g. bank teller)
                </label>
              )}
            </div>
            {errors.form && <Notice tone="danger">{errors.form}</Notice>}
          </CardBody>
          <CardFooter>
            <Button variant="secondary" onClick={() => router.push("/support")} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Submit ticket
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
