import type { Metadata } from "next";
import QuizKaloriGame from "./QuizKaloriGame";

export const metadata: Metadata = {
  title: "Quiz — Kalorisini Tahmin Et | Oyna",
  description: "Yemeği görüyorsun ama kaç kalori? Sezgin ne kadar güçlü?",
};

export default function QuizKaloriPage() {
  return <QuizKaloriGame />;
}
