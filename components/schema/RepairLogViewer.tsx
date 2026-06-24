import type { RepairAction } from "@/types/pipeline";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepairLogViewerProps {
  repairs: RepairAction[];
  success: boolean;
}

export function RepairLogViewer({ repairs, success }: RepairLogViewerProps) {
  if (!repairs || repairs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-400">No repairs were needed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl border",
        success
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-amber-500/10 border-amber-500/20"
      )}>
        {success ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
        )}
        <div>
          <p className={cn("text-sm font-medium", success ? "text-emerald-300" : "text-amber-300")}>
            {success ? `All ${repairs.length} issues repaired successfully` : `${repairs.length} repairs attempted — some issues remain`}
          </p>
        </div>
      </div>

      {/* Repair entries */}
      <div className="space-y-3">
        {repairs.map((repair, idx) => (
          <div
            key={`${repair.issueId}-${idx}`}
            className={cn(
              "rounded-xl border p-4 space-y-3",
              repair.success
                ? "bg-white/5 border-white/10"
                : "bg-red-500/10 border-red-500/20"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {repair.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm text-white font-medium">{repair.description}</p>
                  <p className="text-xs text-slate-500 font-mono">{repair.issueCode}</p>
                </div>
              </div>
              <span className="text-xs uppercase tracking-wider text-slate-500 px-2 py-0.5 bg-white/5 rounded">
                {repair.schema}
              </span>
            </div>

            {repair.field && (
              <p className="text-xs text-slate-400">
                Field: <code className="text-violet-400 bg-violet-500/10 px-1 rounded">{repair.field}</code>
              </p>
            )}

            {/* Before / After diff */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="text-slate-500 font-medium">Before</p>
                <pre className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-300 overflow-auto max-h-24 text-xs">
                  {JSON.stringify(repair.before, null, 2).slice(0, 200)}
                  {JSON.stringify(repair.before).length > 200 ? "…" : ""}
                </pre>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 font-medium">After</p>
                <pre className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-emerald-300 overflow-auto max-h-24 text-xs">
                  {JSON.stringify(repair.after, null, 2).slice(0, 200)}
                  {JSON.stringify(repair.after).length > 200 ? "…" : ""}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
