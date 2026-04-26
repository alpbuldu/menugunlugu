import type { Metadata } from "next";
import PasswordUpdateForm from "./PasswordUpdateForm";

export const metadata: Metadata = {
  title: "Şifre Güncelle — Menü Günlüğü",
};

export default function SifreGuncellePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold text-warm-800">Yeni Şifre Belirle</h1>
          <p className="text-warm-500 text-sm mt-1">En az 6 karakter olmalı</p>
        </div>
        <PasswordUpdateForm />
      </div>
    </div>
  );
}
