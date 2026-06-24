import { cn } from "@/lib/utils";
import type { ValidationIssue, ValidationReport } from "@/types/pipeline";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ValidationPanelProps {
  report: ValidationReport;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    label: "Info",
  },
};

function IssueItem({ issue }: { issue: ValidationIssue }) {
  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border p-4 space-y-2", config.bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-slate-400">{issue.code}</span>
            <Badge variant={issue.severity === "error" ? "error" : issue.severity === "warning" ? "warning" : "info"}>
              {issue.schema.toUpperCase()}
            </Badge>
            {issue.field && (
              <span className="text-xs text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                {issue.field}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-200">{issue.message}</p>
          {issue.suggestion && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-violet-400">💡</span> {issue.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ValidationPanel({ report }: ValidationPanelProps) {
  const { issues, summary, isValid } = report;

  if (isValid && issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <p className="text-white font-medium">All validations passed</p>
        <p className="text-sm text-slate-400">No issues found in any schema</p>
      </div>
    );
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Errors", count: summary.errors, variant: "error" as const },
          { label: "Warnings", count: summary.warnings, variant: "warning" as const },
          { label: "Info", count: summary.info, variant: "info" as const },
        ].map(({ label, count }) => (
          <div key={label} className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold text-white">{count}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Issues list */}
      {[
        { items: errors, label: "Errors" },
        { items: warnings, label: "Warnings" },
        { items: infos, label: "Info" },
      ]
        .filter(({ items }) => items.length > 0)
        .map(({ items, label }) => (
          <div key={label} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</h4>
            {items.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))}
          </div>
        ))}
    </div>
  );
}
