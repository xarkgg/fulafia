"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Paperclip, SearchX, Send, X } from "lucide-react";
import { getTicket, replyToTicket } from "@/lib/api";
import { errorMessage, useAsync } from "@/lib/use-async";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { TicketStatusBadge } from "@/components/status";
import { useStudent } from "@/components/shell/student-context";

export function TicketView({ id }: { id: string }) {
  const toast = useToast();
  const { student } = useStudent();
  const q = useAsync(() => getTicket(id), [id]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (q.data) endRef.current?.scrollIntoView({ block: "end" });
  }, [q.data?.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const t = await replyToTicket(id, body, file?.name);
      q.setData(t);
      setBody("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Reply sent");
    } catch (err) {
      toast.error("Couldn't send", errorMessage(err));
    } finally {
      setSending(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
  }

  const back = (
    <Link href="/support" className="pressable mb-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-ink">
      <ArrowLeft className="size-4" /> All tickets
    </Link>
  );

  if (q.error) {
    const notFound = /couldn't find|not found/i.test(q.error.message);
    return (
      <>
        {back}
        {notFound ? (
          <Card>
            <EmptyState
              icon={<SearchX />}
              title="Ticket not found"
              description={`We couldn't find ticket ${id}. It may have been opened from another account.`}
              action={<ButtonLink href="/support" size="sm">Back to support</ButtonLink>}
            />
          </Card>
        ) : (
          <ErrorState onRetry={q.reload} />
        )}
      </>
    );
  }

  if (!q.data) {
    return (
      <>
        {back}
        <div className="space-y-3" role="status" aria-label="Loading ticket">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-6 h-24 w-4/5" />
          <Skeleton className="ml-auto h-20 w-3/4" />
        </div>
      </>
    );
  }

  const t = q.data;
  const studentName = student ? `${student.firstName} ${student.lastName}` : "You";

  return (
    <>
      {back}
      <header className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <TicketStatusBadge status={t.status} />
          <Badge>{t.category}</Badge>
          {t.priority === "high" && <Badge tone="danger">High priority</Badge>}
        </div>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{t.subject}</h1>
        <p className="mt-1 text-sm text-muted">
          {t.id} · Opened {formatDateTime(t.createdAt)}
        </p>
      </header>

      <ol className="space-y-4" aria-label="Conversation">
        {t.messages.map((m) => {
          const mine = m.author === "student";
          const [who, role] = mine ? ["You", null] : m.name.split(" · ").reverse();
          return (
            <li key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
              {mine ? (
                <Avatar name={studentName} src={student?.photoUrl ?? undefined} size={32} />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-bold text-gold-strong" aria-hidden>
                  {(who ?? "S")[0]}
                </span>
              )}
              <div className={cn("max-w-[85%] sm:max-w-[70%]", mine && "items-end text-right")}>
                <p className="mb-1 text-xs text-muted">
                  <span className="font-semibold text-ink">{who}</span>
                  {role && <span> · {role}</span>} · {formatDateTime(m.at)}
                </p>
                <div
                  className={cn(
                    "inline-block whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-left text-[15px] leading-relaxed",
                    mine ? "rounded-tr-md bg-[#0b1f3a] text-white dark:bg-gold-soft dark:text-ink" : "rounded-tl-md border border-border bg-surface text-ink",
                  )}
                >
                  {m.body}
                  {m.attachment && (
                    <span
                      className={cn(
                        "mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm",
                        mine ? "bg-white/10 dark:bg-surface-2" : "bg-surface-2",
                      )}
                    >
                      <Paperclip className="size-3.5" aria-hidden /> {m.attachment}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />

      <form
        onSubmit={send}
        className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] mt-6 rounded-2xl border border-border bg-surface p-2 shadow-pop lg:bottom-4"
      >
        {(t.status === "resolved" || t.status === "closed") && (
          <p className="px-2 pb-2 pt-1 text-xs text-muted">This ticket is {t.status}. Replying will reopen it.</p>
        )}
        {file && (
          <div className="mx-1 mb-2 flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-sm">
            <Paperclip className="size-3.5 text-muted" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <button type="button" className="pressable rounded p-0.5 text-subtle hover:text-ink" aria-label="Remove attachment" onClick={() => setFile(null)}>
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <input ref={fileRef} id="reply-file" type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <label
            htmlFor="reply-file"
            className="pressable grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Attach a file"
          >
            <Paperclip className="size-5" />
          </label>
          <label htmlFor="reply" className="sr-only">
            Reply
          </label>
          <textarea
            id="reply"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Write a reply…"
            enterKeyHint="send"
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-ink placeholder:text-subtle focus:outline-none"
          />
          <Button type="submit" size="icon" loading={sending} disabled={!body.trim()} aria-label="Send reply" className="shrink-0">
            {!sending && <Send className="size-4" />}
          </Button>
        </div>
      </form>
    </>
  );
}
