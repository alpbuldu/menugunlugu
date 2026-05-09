"use client";
import { usePathname } from "next/navigation";
import Chatbot from "@/components/Chatbot";

export default function ChatbotConditional() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/oyna") || pathname?.startsWith("/omubumu")) return <div className="hidden sm:block"><Chatbot /></div>;
  return <Chatbot />;
}
