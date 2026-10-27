import type { Metadata } from "next";
import { ResultsView } from "./results-view";

export const metadata: Metadata = { title: "Results" };

export default function Page() {
  return <ResultsView />;
}
