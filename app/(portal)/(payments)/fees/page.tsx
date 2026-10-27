import type { Metadata } from "next";
import { FeesView } from "./fees-view";

export const metadata: Metadata = { title: "Fees" };

export default function Page() {
  return <FeesView />;
}
