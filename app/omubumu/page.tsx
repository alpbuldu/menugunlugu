import type { Metadata } from "next";
import OmuBumuGame from "@/components/ui/OmuBumuGame";

export const metadata: Metadata = {
  title: "O mu Bu mu? | Menü Günlüğü",
  description: "Tarafını seç, en sevdiğin yemeği bul!",
};

export default function OmuBumuPage() {
  return <OmuBumuGame />;
}
