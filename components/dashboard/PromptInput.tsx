"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Input";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PipelineProgress } from "@/components/pipeline/PipelineProgress";
import type { PipelineStageInfo } from "@/components/pipeline/PipelineProgress";

const EXAMPLE_PROMPTS = [
  "A SaaS project management tool with teams, tasks, milestones, and time tracking",
  "An e-commerce marketplace with vendors, products, orders, reviews, and payments",
  "A healthcare patient portal with appointments, prescriptions, and doctor profiles",
  "A social learning platform with courses, lessons, quizzes, and progress tracking",
];

const STAGE_DEFINITIONS: PipelineStageInfo[] = [
  { key: "intent", name: "Intent Extraction", description: "Analyzing your idea and extracting entities, roles, and features", status: "pending" },
  { key: "design", name: "System Design", description: "Designing data models, relationships, and workflows", status: "pending" },
  { key: "schema", name: "Schema Generation", description: "Generating UI, API, DB, and Auth schemas with Gemini", status: "pending" },
  { key: "validation", name: "Validation", description: "Checking schemas for consistency and completeness", status: "pending" },
  { key: "repair", name: "Auto-Repair", description: "AI-powered repair of any validation issues found", status: "pending" },
  { key: "preview", name: "Preview Build", description: "Building a live visual preview of your application", status: "pending" },
];

export function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [showPipeline, setShowPipeline] = useState(false);
  const [stages, setStages] = useState<PipelineStageInfo[]>(STAGE_DEFINITIONS);
  const [isComplete, setIsComplete] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | undefined>();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateStage = (key: string, updates: Partial<PipelineStageInfo>) => {
    setStages(prev => prev.map(s => s.key === key ? { ...s, ...updates } : s));
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      setError("Please enter at least 10 characters.");
      return;
    }
    setError("");

    // Reset and show pipeline
    setStages(STAGE_DEFINITIONS.map(s => ({ ...s, status: "pending" })));
    setIsComplete(false);
    setPipelineError(undefined);
    setIsDemoMode(false);
    setShowPipeline(true);

    try {
      const response = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        setPipelineError("Failed to start generation. Please try again.");
        setIsComplete(true);
        return;
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let projectId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          if (!chunk.trim()) continue;
          const eventMatch = chunk.match(/^event: (.+)$/m);
          const dataMatch = chunk.match(/^data: (.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          let data: Record<string, unknown>;
          try {
            data = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }

          switch (event) {
            case "start":
              projectId = data.projectId as string;
              break;
            case "stage:start":
              updateStage(data.stage as string, { status: "running" });
              break;
            case "stage:done":
              updateStage(data.stage as string, { status: "done", latencyMs: data.latencyMs as number });
              break;
            case "stage:error":
              updateStage(data.stage as string, { status: "error", error: data.error as string, latencyMs: data.latencyMs as number });
              break;
            case "stage:skip":
              updateStage(data.stage as string, { status: "skipped" });
              break;
            case "demo_mode":
              setIsDemoMode(data.active as boolean);
              break;
            case "complete":
              setIsComplete(true);
              if (data.isDemoMode) setIsDemoMode(true);
              if (projectId) {
                // Brief delay so user sees the success state
                setTimeout(() => {
                  router.push(`/project/${projectId}`);
                }, 1500);
              }
              break;
            case "error":
              setPipelineError(data.message as string ?? "An error occurred");
              setIsComplete(true);
              break;
          }
        }
      }
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : "Network error");
      setIsComplete(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <>
      {/* Pipeline Progress Overlay */}
      <AnimatePresence>
        {showPipeline && (
          <PipelineProgress
            stages={stages}
            prompt={prompt}
            isComplete={isComplete}
            isDemoMode={isDemoMode}
            error={pipelineError}
            onClose={() => {
              setShowPipeline(false);
              setIsComplete(false);
              setPipelineError(undefined);
            }}
          />
        )}
      </AnimatePresence>

      <div className="w-full space-y-5">
        <div className="relative group">
          <Textarea
            ref={textareaRef}
            id="app-prompt"
            placeholder="Describe your application... e.g. 'A SaaS project management tool with teams, tasks, deadlines, and role-based access'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className="pr-4 text-base bg-white/70 dark:bg-black/40 backdrop-blur-xl border-gray-200 dark:border-white/10 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
            error={error}
          />
          <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_30px_rgba(99,102,241,0.15)]" />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-semibold text-gray-500 dark:text-white/40 py-1">Try:</span>
          {EXAMPLE_PROMPTS.map((example) => (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              key={example}
              onClick={() => setPrompt(example)}
              className="text-xs font-semibold text-gray-600 dark:text-white/70 bg-white/50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:text-black dark:hover:text-white dark:hover:border-white/20 transition-all truncate max-w-[240px] shadow-sm backdrop-blur-md dark:shadow-[0_4px_15px_rgba(0,0,0,0.3)]"
            >
              {example.slice(0, 35)}…
            </motion.button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
          <p className="text-sm font-medium text-gray-400 dark:text-white/40">
            {prompt.length}/5000 <span className="mx-2 opacity-50">|</span> Press{" "}
            <kbd className="px-2 py-1 rounded-md border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/80 text-xs font-mono shadow-sm">
              ⌘↵
            </kbd>{" "}
            to generate
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            id="generate-btn"
            onClick={handleGenerate}
            disabled={!prompt.trim() || showPipeline}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-[#dced31] to-[#fb8f44] dark:from-indigo-600 dark:via-purple-600 dark:to-indigo-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#fb8f44]/20 dark:shadow-[0_0_30px_rgba(99,102,241,0.4)] text-black dark:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10 text-lg tracking-wide font-semibold">Generate App</span>
          </motion.button>
        </div>
      </div>
    </>
  );
}
