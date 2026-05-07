import type { Metadata } from "next";
import QuizKaloriGame from "./QuizKaloriGame";

export const metadata: Metadata = {
  title: "Quiz — Kalorisini Tahmin Et | Oyna",
  description: "Yemeğin kalori değerini doğru tahmin edebilecek misin?",
};

export default function QuizKaloriPage() {
  return <QuizKaloriGame />;
}
