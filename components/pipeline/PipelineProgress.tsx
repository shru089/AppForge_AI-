"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Sparkles, Brain, Layers, Database, ShieldCheck, Wrench, Eye, SkipForward } from "lucide-react";

export type StageStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface PipelineStageInfo {
  key: string;
  name: string;
  description: string;
  latencyMs?: number;
  status: StageStatus;
  error?: string;
}

const STAGE_ICONS: Record<string, React.ReactNode> = {
  intent: <Brain className="w-4 h-4" />,
  design: <Layers className="w-4 h-4" />,
  schema: <Database className="w-4 h-4" />,
  validation: <ShieldCheck className="w-4 h-4" />,
  repair: <Wrench className="w-4 h-4" />,
  preview: <Eye className="w-4 h-4" />,
};

const STAGE_COLORS: Record<StageStatus, string> = {
  pending: "text-gray-400 dark:text-white/30",
  running: "text-[#fb8f44] dark:text-indigo-400",
  done: "text-emerald-500 dark:text-emerald-400",
  error: "text-red-500 dark:text-red-400",
  skipped: "text-gray-400 dark:text-white/30",
};

const STAGE_BG: Record<StageStatus, string> = {
  pending: "bg-gray-100 dark:bg-white/[0.03] border-gray-200 dark:border-white/5",
  running: "bg-orange-50 dark:bg-indigo-500/10 border-orange-200 dark:border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
  done: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
  error: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30",
  skipped: "bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5",
};

function StageIcon({ status, stageKey }: { status: StageStatus; stageKey: string }) {
  if (status === "running") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="text-[#fb8f44] dark:text-indigo-400"
      >
        <Loader2 className="w-4 h-4" />
      </motion.div>
    );
  }
  if (status === "done") return <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
  if (status === "error") return <X className="w-4 h-4 text-red-500" />;
  if (status === "skipped") return <SkipForward className="w-4 h-4 text-gray-400 dark:text-white/30" />;
  return <span className={STAGE_COLORS[status]}>{STAGE_ICONS[stageKey]}</span>;
}

interface PipelineProgressProps {
  stages: PipelineStageInfo[];
  prompt: string;
  isComplete: boolean;
  isDemoMode?: boolean;
  error?: string;
  onClose?: () => void;
}

export function PipelineProgress({ stages, prompt, isComplete, isDemoMode, error, onClose }: PipelineProgressProps) {
  const completedCount = stages.filter(s => s.status === "done" || s.status === "skipped").length;
  const progressPct = stages.length > 0 ? (completedCount / stages.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(0,0,0,0.6)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-lg bg-white dark:bg-[#07050d]/90 backdrop-blur-2xl rounded-[28px] border border-gray-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] dark:shadow-[0_0_40px_rgba(99,102,241,0.15)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <motion.div
              animate={isComplete ? {} : { scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#dced31] to-[#fb8f44] dark:from-indigo-500 dark:to-purple-600 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2">
                {isComplete ? (error ? "Pipeline Failed" : "App Generated!") : "Generating Your App…"}
                {isDemoMode && (
                  <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-500/30">
                    Demo Mode
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-white/40 truncate max-w-[320px]">{prompt}</p>
            </div>
          </div>

          {isDemoMode && (
            <div className="mt-2 mb-1 p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                AI generation unavailable. Using pre-defined schema templates.
              </p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#dced31] to-[#fb8f44] dark:from-indigo-500 dark:to-purple-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400 dark:text-white/30">
              {completedCount} of {stages.length} stages
            </span>
            <span className="text-[10px] text-gray-400 dark:text-white/30">{Math.round(progressPct)}%</span>
          </div>
        </div>

        {/* Stages */}
        <div className="p-4 space-y-2 max-h-[360px] overflow-y-auto">
          {stages.map((stage, i) => (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${STAGE_BG[stage.status]}`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-white dark:bg-black/40 border border-gray-100 dark:border-white/10 shadow-sm">
                <StageIcon status={stage.status} stageKey={stage.key} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${stage.status === "pending" ? "text-gray-400 dark:text-white/30" : "text-black dark:text-white"}`}>
                    {stage.name}
                  </span>
                  {stage.status === "running" && (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-[10px] font-bold text-[#fb8f44] dark:text-indigo-400 uppercase tracking-wider"
                    >
                      running
                    </motion.span>
                  )}
                  {stage.status === "skipped" && (
                    <span className="text-[10px] font-medium text-gray-400 dark:text-white/30">skipped</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">
                  {stage.status === "error" && stage.error ? stage.error : stage.description}
                </p>
              </div>
              {stage.latencyMs !== undefined && stage.status !== "pending" && (
                <span className="text-[10px] font-mono text-gray-400 dark:text-white/30 flex-shrink-0">
                  {(stage.latencyMs / 1000).toFixed(1)}s
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 pt-0"
            >
              {error ? (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                    App blueprint complete! Redirecting to your project…
                  </p>
                </div>
              )}
              {error && onClose && (
                <button
                  onClick={onClose}
                  className="mt-3 w-full py-2 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
