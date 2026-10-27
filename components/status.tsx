import { Badge, type Tone } from "@/components/ui/badge";
import type { FeeStatus, InvoiceStatus, RegistrationStatus, TicketStatus } from "@/lib/types";

const fee: Record<FeeStatus, [string, Tone]> = {
  paid: ["Paid", "success"],
  unpaid: ["Outstanding", "warning"],
  upcoming: ["Not yet due", "neutral"],
};
const invoice: Record<InvoiceStatus, [string, Tone]> = {
  paid: ["Paid", "success"],
  pending: ["Awaiting confirmation", "warning"],
  unpaid: ["Unpaid", "neutral"],
  failed: ["Failed", "danger"],
};
const reg: Record<RegistrationStatus, [string, Tone]> = {
  not_started: ["Not started", "neutral"],
  draft: ["Draft, not submitted", "warning"],
  submitted: ["Submitted", "info"],
  approved: ["Approved", "success"],
};
const ticket: Record<TicketStatus, [string, Tone]> = {
  open: ["Open", "info"],
  in_progress: ["In progress", "warning"],
  resolved: ["Resolved", "success"],
  closed: ["Closed", "neutral"],
};

export const FeeStatusBadge = ({ status }: { status: FeeStatus }) => <Badge tone={fee[status][1]} dot>{fee[status][0]}</Badge>;
export const InvoiceStatusBadge = ({ status }: { status: InvoiceStatus }) => (
  <Badge tone={invoice[status][1]} dot>{invoice[status][0]}</Badge>
);
export const RegistrationStatusBadge = ({ status }: { status: RegistrationStatus }) => (
  <Badge tone={reg[status][1]} dot>{reg[status][0]}</Badge>
);
export const TicketStatusBadge = ({ status }: { status: TicketStatus }) => (
  <Badge tone={ticket[status][1]} dot>{ticket[status][0]}</Badge>
);
export const ticketStatusLabel = (s: TicketStatus) => ticket[s][0];
export const registrationLabel = (s: RegistrationStatus) => reg[s][0];
