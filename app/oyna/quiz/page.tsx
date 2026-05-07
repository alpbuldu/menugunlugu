import type { Metadata } from "next";
import QuizGame from "./QuizGame";

export const metadata: Metadata = {
  title: "Quiz — Yemeği Tahmin Et | Oyna",
  description: "Bulanık görsel, sınırlı ipucu. Yemeği tahmin edebilecek misin?",
};

export default function QuizPage() {
  return <QuizGame />;
}
