import type { Metadata } from "next";
import KorSiralamaGame from "./KorSiralamaGame";

export const metadata: Metadata = {
  title: "Kör Sıralama | Oyna",
  description: "Yemekleri görmeden sırala, sezgine güven!",
};

export default function KorSiralamaPage() {
  return <KorSiralamaGame />;
}
