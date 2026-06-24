"use client";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SchemaViewerProps {
  data: unknown;
  title?: string;
  language?: string;
}

export function SchemaViewer({ data, title, language = "json" }: SchemaViewerProps) {
  const [copied, setCopied] = useState(false);

  const code =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <span className="text-sm font-medium text-slate-300">{title ?? "Schema"}</span>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? (
            <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
          ) : (
            <><Copy className="w-3.5 h-3.5" /> Copy</>
          )}
        </Button>
      </div>
      <div className="max-h-[500px] overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            background: "transparent",
            fontSize: "12px",
            lineHeight: "1.6",
          }}
          showLineNumbers
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
