"use client";
import { useState } from "react";

const SQL = `ALTER TABLE admin_profile ADD COLUMN IF NOT EXISTS comment_user_id uuid;`;

export default function MigrationBox() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <pre className="bg-amber-100 text-amber-900 text-xs rounded-xl px-4 py-3 pr-20 font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {SQL}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-800 text-xs font-medium transition-colors"
      >
        {copied ? "✅ Kopyalandı" : "Kopyala"}
      </button>
    </div>
  );
}
