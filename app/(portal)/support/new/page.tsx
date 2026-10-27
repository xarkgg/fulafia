import { Suspense } from "react";
import type { Metadata } from "next";
import { NewTicketView } from "./new-ticket-view";

export const metadata: Metadata = { title: "New ticket" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <NewTicketView />
    </Suspense>
  );
}
