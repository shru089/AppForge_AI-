"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, RefreshCw, Brain, Database, Globe, Shield, Eye,
  Wrench, ShieldCheck, Layers, Clock, ArrowLeft, Check, X,
  ChevronRight, Sparkles, Copy, CheckCheck,
} from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
interface StageResult {
  stage: string;
  success: boolean;
  latencyMs: number;
  error?: string;
}

interface ProjectData {
  id: string;
  name: string;
  prompt: string;
  status: string;
  createdAt: string;
  generatedSchema?: {
    intentJson: unknown;
    systemDesign: unknown;
    uiSchema: unknown;
    apiSchema: unknown;
    dbSchema: unknown;
    authSchema: unknown;
  };
  validationReports: Array<{ issues: unknown; status: string }>;
  repairLogs: Array<{ repairs: unknown; success: boolean }>;
  stages?: StageResult[];
  metrics: { totalLatencyMs: number; successRate: number; totalRepairs: number; stageCount: number };
}

// ── Stage display config ───────────────────────────────────────────────────────
const STAGE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  intent: { label: "Intent Extraction", icon: <Brain className="w-3.5 h-3.5" />, color: "text-blue-500 dark:text-blue-400" },
  design: { label: "System Design", icon: <Layers className="w-3.5 h-3.5" />, color: "text-purple-500 dark:text-purple-400" },
  schema: { label: "Schema Generation", icon: <Database className="w-3.5 h-3.5" />, color: "text-indigo-500 dark:text-indigo-400" },
  validation: { label: "Validation", icon: <ShieldCheck className="w-3.5 h-3.5" />, color: "text-emerald-500 dark:text-emerald-400" },
  repair: { label: "Auto-Repair", icon: <Wrench className="w-3.5 h-3.5" />, color: "text-amber-500 dark:text-amber-400" },
  preview: { label: "Preview Build", icon: <Eye className="w-3.5 h-3.5" />, color: "text-pink-500 dark:text-pink-400" },
};

// ── JSON Viewer ────────────────────────────────────────────────────────────────
function JsonBlock({ data, title }: { data: unknown; title: string }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const jsonStr = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white/90 hover:text-[#aadd00] dark:hover:text-white transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-90"}`} />
          {title}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <pre className="p-4 text-xs font-mono text-gray-700 dark:text-slate-300 overflow-x-auto max-h-[400px] overflow-y-auto leading-relaxed scrollbar-thin">
              {jsonStr}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tab system ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Overview", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: "ui", label: "UI Schema", icon: <Globe className="w-3.5 h-3.5" /> },
  { id: "api", label: "API Schema", icon: <Layers className="w-3.5 h-3.5" /> },
  { id: "db", label: "DB Schema", icon: <Database className="w-3.5 h-3.5" /> },
  { id: "auth", label: "Auth Schema", icon: <Shield className="w-3.5 h-3.5" /> },
  { id: "preview", label: "Live Preview", icon: <Eye className="w-3.5 h-3.5" /> },
];

// ── Preview renderer ───────────────────────────────────────────────────────────
function AppPreview({ uiSchema }: { uiSchema: unknown }) {
  const schema = uiSchema as {
    pages?: Array<{ name: string; path: string; auth: boolean }>;
    components?: Array<{ name: string; type: string; entity?: string; fields?: string[] }>;
  } | null;

  if (!schema) return <div className="text-center py-16 text-gray-400">No preview available</div>;

  const pages = schema.pages ?? [];
  const components = schema.components ?? [];

  return (
    <div className="space-y-6">
      {/* Browser chrome */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl">
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 h-6 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 flex items-center mx-2">
            <span className="text-xs text-gray-400 dark:text-white/30 font-mono">localhost:3000</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0a0a14] p-6">
          {/* Nav bar mockup */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-[#dced31] to-[#fb8f44] dark:from-indigo-500 dark:to-purple-500" />
              <div className="w-24 h-3 rounded bg-gray-200 dark:bg-white/10" />
            </div>
            <div className="flex gap-3">
              {pages.slice(0, 4).map((p, i) => (
                <div key={i} className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10">
                  {p.name}
                </div>
              ))}
            </div>
          </div>

          {/* Components grid */}
          <div className="grid grid-cols-1 gap-4">
            {components.slice(0, 4).map((comp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-black dark:text-white/80">{comp.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-mono">
                    {comp.type}
                  </span>
                </div>
                {comp.type === "Table" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-white/5">
                          {(comp.fields ?? ["id", "name", "status", "createdAt"]).slice(0, 5).map(f => (
                            <th key={f} className="px-3 py-2 text-left text-gray-400 dark:text-white/30 font-medium uppercase tracking-wider text-[10px]">{f}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map(row => (
                          <tr key={row} className="border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            {(comp.fields ?? ["id", "name", "status", "createdAt"]).slice(0, 5).map(f => (
                              <td key={f} className="px-3 py-2">
                                <div className="h-2.5 rounded-full bg-gray-200 dark:bg-white/10" style={{ width: `${40 + Math.random() * 40}%` }} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {comp.type === "Form" && (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {(comp.fields ?? ["name", "email", "description"]).slice(0, 4).map(f => (
                      <div key={f}>
                        <div className="text-[10px] text-gray-400 dark:text-white/30 mb-1 capitalize">{f}</div>
                        <div className="h-8 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10" />
                      </div>
                    ))}
                    <div className="col-span-2 mt-1">
                      <div className="h-8 w-24 rounded-lg bg-gradient-to-r from-[#dced31] to-[#fb8f44] dark:from-indigo-500 dark:to-purple-500 opacity-80" />
                    </div>
                  </div>
                )}
                {comp.type === "Dashboard" && (
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {["Users", "Revenue", "Growth"].map((label, i) => (
                      <div key={label} className="rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3">
                        <div className="text-[10px] text-gray-400 dark:text-white/30">{label}</div>
                        <div className="h-5 w-16 mt-1 rounded bg-gray-200 dark:bg-white/10" />
                        <div className="h-1.5 w-full mt-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${50 + i * 15}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {comp.type === "Card" && (
                  <div className="p-4">
                    <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-white/10 mb-2" />
                    <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-white/5 mb-1" />
                    <div className="h-2.5 w-2/3 rounded bg-gray-100 dark:bg-white/5" />
                  </div>
                )}
                {!["Table", "Form", "Dashboard", "Card"].includes(comp.type) && (
                  <div className="p-4 flex items-center justify-center">
                    <div className="text-xs text-gray-400 dark:text-white/30">{comp.entity ? `${comp.entity} component` : comp.type}</div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pages list */}
      {pages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Generated Pages</h3>
          <div className="grid grid-cols-2 gap-3">
            {pages.map((page, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10">
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-black dark:text-white truncate">{page.name}</p>
                  <p className="text-[10px] font-mono text-gray-400 dark:text-white/30 truncate">{page.path}</p>
                </div>
                {page.auth && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">auth</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overview tab ───────────────────────────────────────────────────────────────
function OverviewTab({ project }: { project: ProjectData }) {
  const gs = project.generatedSchema;
  const intent = gs?.intentJson as {
    appType?: string;
    entities?: Array<{ name: string; fields: Array<{ name: string; type: string }> }>;
    roles?: string[];
    features?: Array<{ name: string; description: string }>;
    description?: string;
  } | null;

  return (
    <div className="space-y-6">
      {/* App description */}
      {intent?.description && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#dced31]/10 to-[#fb8f44]/10 dark:from-indigo-500/10 dark:to-purple-600/10 border border-[#dced31]/20 dark:border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#aadd00] dark:text-indigo-400" />
            <span className="text-sm font-semibold text-black dark:text-white">App Description</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed">{intent.description}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "App Type", value: intent?.appType ?? "—", icon: <Sparkles className="w-3.5 h-3.5" /> },
          { label: "Entities", value: String(intent?.entities?.length ?? 0), icon: <Database className="w-3.5 h-3.5" /> },
          { label: "Roles", value: String(intent?.roles?.length ?? 0), icon: <Shield className="w-3.5 h-3.5" /> },
          { label: "Features", value: String(intent?.features?.length ?? 0), icon: <Layers className="w-3.5 h-3.5" /> },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-2 mb-1 text-gray-400 dark:text-white/40">{stat.icon}<span className="text-[10px] uppercase tracking-wider font-semibold">{stat.label}</span></div>
            <p className="text-lg font-bold text-black dark:text-white capitalize">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Entities */}
      {intent?.entities && intent.entities.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Data Entities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {intent.entities.map((entity) => (
              <div key={entity.name} className="p-4 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center">
                    <Database className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-sm font-bold text-black dark:text-white">{entity.name}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entity.fields.slice(0, 6).map((f) => (
                    <span key={f.name} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 font-mono">
                      {f.name}: <span className="text-indigo-500 dark:text-indigo-400">{f.type}</span>
                    </span>
                  ))}
                  {entity.fields.length > 6 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30">+{entity.fields.length - 6} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features */}
      {intent?.features && intent.features.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Features</h3>
          <div className="space-y-2">
            {intent.features.map((feature) => (
              <div key={feature.name} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-black dark:text-white">{feature.name}</p>
                  <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pipeline stages panel ──────────────────────────────────────────────────────
function StagesPanel({ stages, totalMs }: { stages: StageResult[]; totalMs: number }) {
  return (
    <div className="space-y-2">
      {stages.map((s) => {
        const meta = STAGE_META[s.stage] ?? { label: s.stage, icon: <Sparkles className="w-3.5 h-3.5" />, color: "text-gray-400" };
        return (
          <div key={s.stage} className={`flex items-center gap-3 p-3 rounded-xl border ${s.success ? "bg-emerald-50 dark:bg-emerald-500/[0.05] border-emerald-200 dark:border-emerald-500/20" : "bg-red-50 dark:bg-red-500/[0.05] border-red-200 dark:border-red-500/20"}`}>
            <div className="w-7 h-7 rounded-lg bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center flex-shrink-0">
              {s.success
                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                : <X className="w-3.5 h-3.5 text-red-500" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className={meta.color}>{meta.icon}</span>
                <span className="text-xs font-semibold text-black dark:text-white">{meta.label}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-gray-400 dark:text-white/30">{(s.latencyMs / 1000).toFixed(1)}s</span>
          </div>
        );
      })}
      <div className="flex items-center justify-between px-3 pt-2 text-xs text-gray-500 dark:text-white/40 border-t border-gray-100 dark:border-white/5">
        <span>Total pipeline time</span>
        <span className="font-mono font-semibold">{(totalMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProjectPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/project/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProject({ ...data.project, metrics: data.metrics });
        } else {
          setFetchError(data.error ?? "Failed to load project");
        }
      })
      .catch(() => setFetchError("Network error"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExport = () => {
    if (!project?.generatedSchema) return;
    const blob = new Blob([JSON.stringify(project.generatedSchema, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "_")}_schemas.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-[#030108]">
        <Sidebar user={session?.user} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#dced31] to-[#fb8f44] dark:from-indigo-500 dark:to-purple-600 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <p className="text-sm text-gray-500 dark:text-white/40 font-medium">Loading project…</p>
          </div>
        </main>
      </div>
    );
  }

  if (fetchError || !project) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-[#030108]">
        <Sidebar user={session?.user} />
        <main className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-500 dark:text-red-400 text-base font-semibold">{fetchError || "Project not found"}</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-sm font-medium text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const gs = project.generatedSchema;
  const latestValidation = project.validationReports?.[0];
  const stages = project.stages ?? [];

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#030108] text-black dark:text-white transition-colors duration-500">
      <Sidebar user={session?.user} />

      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-10">

          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="text-2xl font-bold text-black dark:text-white">{project.name}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${project.status === "COMPLETED" ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" : project.status === "FAILED" ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30" : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 max-w-2xl">{project.prompt}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(project.createdAt).toLocaleDateString()}</span>
                  {project.metrics && (
                    <>
                      <span>Pipeline: {(project.metrics.totalLatencyMs / 1000).toFixed(1)}s</span>
                      {project.metrics.totalRepairs > 0 && (
                        <span className="text-amber-500 dark:text-amber-400">{project.metrics.totalRepairs} auto-repairs</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
                <button
                  id="export-json-btn"
                  onClick={handleExport}
                  disabled={!gs}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#dced31] to-[#fb8f44] dark:from-indigo-500 dark:to-purple-500 text-black dark:text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex gap-6">
            {/* Left sidebar: pipeline stages */}
            {stages.length > 0 && (
              <div className="w-56 flex-shrink-0">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-3">Pipeline Stages</h3>
                <StagesPanel stages={stages} totalMs={project.metrics?.totalLatencyMs ?? 0} />

                {/* Validation summary */}
                {latestValidation && (
                  <div className="mt-4 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-gray-500 dark:text-white/40" />
                      <span className="text-xs font-semibold text-black dark:text-white">Validation</span>
                    </div>
                    <div className={`text-xs font-bold ${latestValidation.status === "PASSED" ? "text-emerald-500" : "text-amber-500"}`}>
                      {latestValidation.status}
                    </div>
                    {Array.isArray(latestValidation.issues) && (
                      <div className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">
                        {(latestValidation.issues as unknown[]).length} issues found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Tabs */}
              <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                      ? "bg-black dark:bg-white/10 text-white dark:text-white border border-black/10 dark:border-white/10"
                      : "text-gray-500 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "overview" && <OverviewTab project={project} />}
                  {activeTab === "ui" && gs && <JsonBlock data={gs.uiSchema} title="UI Schema" />}
                  {activeTab === "api" && gs && <JsonBlock data={gs.apiSchema} title="API Schema" />}
                  {activeTab === "db" && gs && <JsonBlock data={gs.dbSchema} title="Database Schema" />}
                  {activeTab === "auth" && gs && <JsonBlock data={gs.authSchema} title="Auth Schema" />}
                  {activeTab === "preview" && <AppPreview uiSchema={gs?.uiSchema ?? null} />}
                  {!gs && activeTab !== "overview" && (
                    <div className="text-center py-16 text-gray-400 dark:text-white/30">
                      Schema not yet generated
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
