import { Suspense } from "react";
import type { Metadata } from "next";
import { PrintView } from "./print-view";

export const metadata: Metadata = { title: "Document", robots: { index: false } };

export default function PrintPage() {
  return (
    <Suspense fallback={null}>
      <PrintView />
    </Suspense>
  );
}
