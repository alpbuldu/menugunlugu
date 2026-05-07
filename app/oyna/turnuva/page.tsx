import type { Metadata } from "next";
import TurnuvaGame from "./TurnuvaGame";

export const metadata: Metadata = {
  title: "Turnuva | Oyna",
  description: "Yemekler kapışıyor — tek şampiyon kalana kadar seç!",
};

export default function TurnuvaPage() {
  return <TurnuvaGame />;
}
