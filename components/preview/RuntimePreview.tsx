"use client";
import React from "react";
import type { PreviewComponent } from "@/types/pipeline";

// ── Renderers ────────────────────────────────────────────────────────────────

function FormRenderer({ props }: { props: Record<string, unknown> }) {
  const fields = (props.fields as string[]) ?? ["name", "email"];
  return (
    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-indigo-900/20 p-6">
      <h3 className="text-base font-semibold text-white mb-4">
        {String(props.title ?? "Form")}
      </h3>
      <div className="space-y-3">
        {fields.slice(0, 4).map((field) => (
          <div key={field}>
            <label className="block text-xs text-slate-400 mb-1 capitalize">{field}</label>
            <div className="h-8 rounded-lg bg-white/5 border border-white/10 px-3 flex items-center">
              <span className="text-xs text-slate-600 italic">Enter {field}…</span>
            </div>
          </div>
        ))}
        <button className="mt-2 w-full h-9 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors">
          Submit
        </button>
      </div>
    </div>
  );
}

function TableRenderer({ props }: { props: Record<string, unknown> }) {
  const fields = (props.fields as string[]) ?? ["id", "name", "status", "createdAt"];
  const mockRows = [1, 2, 3].map((i) =>
    Object.fromEntries(fields.map((f) => [f, `${f}_${i}`]))
  );

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{String(props.title ?? "Table")}</h3>
        <span className="text-xs text-slate-400">3 records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              {fields.map((f) => (
                <th key={f} className="px-4 py-2 text-left font-medium text-slate-400 uppercase tracking-wider">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockRows.map((row, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                {fields.map((f) => (
                  <td key={f} className="px-4 py-2 text-slate-300">
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardRenderer({ props }: { props: Record<string, unknown> }) {
  const stats = [
    { label: "Total Users", value: "1,284", change: "+12%" },
    { label: "Active Projects", value: "48", change: "+3%" },
    { label: "Revenue", value: "$24.5K", change: "+8%" },
    { label: "Success Rate", value: "94%", change: "+2%" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-white">{String(props.title ?? "Dashboard")}</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-xs text-emerald-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardRenderer({ props }: { props: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold text-white mb-2">{String(props.title ?? "Card")}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">
        {String(props.description ?? "This card displays information about " + (props.entity ?? "an entity") + ".")}
      </p>
      <div className="mt-4 flex gap-2">
        <div className="h-7 w-16 rounded bg-violet-600/30 border border-violet-500/30" />
        <div className="h-7 w-16 rounded bg-white/5 border border-white/10" />
      </div>
    </div>
  );
}

function InputRenderer({ props }: { props: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs text-slate-400">{String(props.label ?? props.title ?? "Input Field")}</label>
      <div className="h-9 rounded-lg bg-white/5 border border-white/10 px-3 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-white/20" />
        <span className="text-xs text-slate-600">Type here…</span>
      </div>
    </div>
  );
}

function ButtonRenderer({ props }: { props: Record<string, unknown> }) {
  return (
    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all">
      {String(props.label ?? props.title ?? "Action")}
    </button>
  );
}

function FallbackRenderer({ type, props }: { type: string; props: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center">
      <p className="text-amber-400 text-sm font-medium">Unknown Component: {type}</p>
      <p className="text-xs text-slate-500 mt-1">Rendering fallback UI</p>
      <div className="mt-3 text-xs text-slate-600 font-mono bg-black/20 rounded-lg p-2 text-left">
        {JSON.stringify(props, null, 2).slice(0, 100)}
      </div>
    </div>
  );
}

// ── Main Renderer ──────────────────────────────────────────────────────────────

function renderComponent(comp: PreviewComponent): React.ReactNode {
  try {
    switch (comp.type) {
      case "Form":
        return <FormRenderer props={comp.props} />;
      case "Table":
        return <TableRenderer props={comp.props} />;
      case "Dashboard":
        return <DashboardRenderer props={comp.props} />;
      case "Card":
        return <CardRenderer props={comp.props} />;
      case "Input":
        return <InputRenderer props={comp.props} />;
      case "Button":
        return <ButtonRenderer props={comp.props} />;
      default:
        return <FallbackRenderer type={comp.type} props={comp.props} />;
    }
  } catch {
    // Never crash — always render fallback
    return <FallbackRenderer type={comp.type} props={comp.props} />;
  }
}

interface RuntimePreviewProps {
  components: PreviewComponent[];
}

export function RuntimePreview({ components }: RuntimePreviewProps) {
  if (!components || components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
          🎨
        </div>
        <p className="text-slate-400 text-sm">No preview components generated yet.</p>
        <p className="text-slate-500 text-xs">Run the pipeline to generate a live preview.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 h-6 rounded-md bg-white/5 border border-white/10 px-3 flex items-center">
          <span className="text-xs text-slate-500">localhost:3000/preview</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {components.map((comp) => (
          <div key={comp.id} className="animate-slide-up">
            {renderComponent(comp)}
          </div>
        ))}
      </div>
    </div>
  );
}
