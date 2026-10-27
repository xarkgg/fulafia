import type { Metadata } from "next";
import { ElearningView } from "./elearning-view";

export const metadata: Metadata = { title: "E-learning" };

export default function Page() {
  return <ElearningView />;
}
