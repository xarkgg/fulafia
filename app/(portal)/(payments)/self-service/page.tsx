import type { Metadata } from "next";
import { SelfServiceView } from "./self-service-view";

export const metadata: Metadata = { title: "Self service" };

export default function Page() {
  return <SelfServiceView />;
}
