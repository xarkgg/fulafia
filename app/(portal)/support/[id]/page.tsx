import type { Metadata } from "next";
import { TicketView } from "./ticket-view";

export const metadata: Metadata = { title: "Ticket" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketView id={decodeURIComponent(id)} />;
}
