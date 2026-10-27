import type { Metadata } from "next";
import { BioDataView } from "./biodata-view";

export const metadata: Metadata = { title: "Bio data" };

export default function Page() {
  return <BioDataView />;
}
