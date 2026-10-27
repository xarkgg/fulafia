import type { Metadata } from "next";
import { SupportView } from "./support-view";

export const metadata: Metadata = { title: "Support" };

export default function Page() {
  return <SupportView />;
}
