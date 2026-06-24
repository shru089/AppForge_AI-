import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDashboardStats } from "@/lib/metrics";
import { Sidebar } from "@/components/layout/Sidebar";
import { PromptInput } from "@/components/dashboard/PromptInput";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { MetricsSummary } from "@/components/dashboard/MetricsSummary";
import { Sparkles, FolderOpen, AlertTriangle } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import type { Metadata } from "next";
import { LiquidBackgroundWrapper as LiquidBackground } from "@/components/ui/LiquidBackgroundWrapper";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let projects: any[] = [];
  let stats = {
    totalProjects: 0,
    completedProjects: 0,
    failedProjects: 0,
    successRate: 0,
    avgLatencyMs: 0,
    totalRepairs: 0,
  };
  let dbError = false;

  try {
    // 1) Fetch projects
    projects = await db.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // 2) Try to get metrics
    try {
      const metrics = await getDashboardStats(session.user.id);
      stats = {
        totalProjects: metrics.totalProjects,
        completedProjects: metrics.completedProjects,
        failedProjects: metrics.failedProjects,
        successRate: metrics.successRate,
        avgLatencyMs: metrics.avgLatencyMs,
        totalRepairs: metrics.totalRepairs,
      };
    } catch (metricError) {
      console.error("Metric calculation failed, continuing with partial stats", metricError);
      // Fallback: manually calculate from the fetched projects if metric service is down
      const total = projects.length;
      const completed = projects.filter((p) => p.status === "COMPLETED").length;
      const failed = projects.filter((p) => p.status === "FAILED").length;
      stats = {
        totalProjects: total,
        completedProjects: completed,
        failedProjects: failed,
        successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgLatencyMs: 0,
        totalRepairs: 0,
      };
    }
  } catch (error) {
    console.error("Dashboard data load failed:", error);
    dbError = true;
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#030108] text-[#1a1a1a] dark:text-white relative selection:bg-[#fb8f44]/30 dark:selection:bg-indigo-500/30 overflow-hidden font-sans transition-colors duration-500">
      {/* Background Water Ripple Effect */}
      <div className="dark:opacity-30 dark:mix-blend-screen transition-opacity duration-500">
        <LiquidBackground />
      </div>

      <Sidebar user={session.user} />

      <main className="flex-1 ml-64 min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto px-10 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-white/50 mb-3">
              <Sparkles className="w-4 h-4 text-[#ccff00] dark:text-white/60" />
              <span className="tracking-wide uppercase">AI Application Builder</span>
            </div>
            <h1 className="text-5xl font-extrabold text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/70 mb-3 tracking-tight">
              Welcome back,{" "}
              <span className="text-[#aadd00] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#dced31] dark:to-[#fb8f44] dark:drop-shadow-[0_0_25px_rgba(251,143,68,0.4)]">
                {session.user.name?.split(" ")[0] ?? "Builder"}
              </span>
            </h1>
            <p className="text-gray-500 dark:text-[#8a8a9e] font-medium text-lg">
              Describe your application below and let the AI pipeline build it for you.
            </p>
          </div>

          {dbError && (
            <LiquidGlassCard className="mb-8 border border-red-500/30">
              <div className="p-5 flex items-start gap-4">
                <div className="p-2.5 bg-red-500/20 rounded-xl text-red-400 mt-0.5 shadow-inner">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-400 mb-1">Database Connection Error</h3>
                  <p className="text-sm text-red-400/80 leading-relaxed">
                    We're having trouble connecting to your projects. You can still use the prompt box to start a new app, but your history may not save properly until the connection is restored.
                  </p>
                </div>
              </div>
            </LiquidGlassCard>
          )}

          {/* Main Prompt Input Area */}
          <div className="mb-12 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-[32px] blur-xl opacity-50 dark:opacity-100 transition-opacity"></div>
            <PromptInput />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
                    <FolderOpen className="w-4 h-4 text-black dark:text-white/80" />
                  </div>
                  <h2 className="text-xl font-bold text-black dark:text-white/90">Recent Projects</h2>
                </div>
              </div>

              {projects.length === 0 && !dbError ? (
                <LiquidGlassCard className="py-16 text-center border-dashed border-2">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-200 dark:border-white/10">
                    <Sparkles className="w-8 h-8 text-gray-400 dark:text-white/20" />
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">No projects yet</h3>
                  <p className="text-gray-500 dark:text-white/40 max-w-sm mx-auto">
                    Type a prompt above to generate your first AI application.
                  </p>
                </LiquidGlassCard>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <MetricsSummary stats={stats} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
